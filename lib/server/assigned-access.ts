import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import {
  buildAssignedDisplayName,
  createEmptyAssignedAccessSnapshot,
  getPermissionsForAssignedAccessLevel,
  type AssignedAccessLevel,
  type AssignedAccessSnapshot,
} from "@/lib/assigned-access"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database, DbEnums, DbTables } from "@/lib/supabase/database.types"

type AdminClient = SupabaseClient<Database>

export type AssignedOrganizationRow = DbTables["assigned_organizations"]["Row"]
export type AssignedUserProfileRow = DbTables["assigned_user_profiles"]["Row"]
export type AssignedMembershipRow = DbTables["assigned_memberships"]["Row"]
export type AssignedTeamRow = DbTables["assigned_teams"]["Row"]
export type AssignedPositionRow = DbTables["assigned_positions"]["Row"]
export type AssignedProjectRow = DbTables["assigned_projects"]["Row"]

const ASSIGNED_ADMIN_TEAM_SLUG = "admin"

function requireAuthenticatedUser(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("You must be signed in.")
  }
}

export type AssignedAccessContext = AssignedAccessSnapshot & {
  user: User | null
  membershipId: string | null
  organizationId: string | null
  memberStatus: DbEnums["assigned_member_status"] | null
  availability: DbEnums["assigned_availability_status"] | null
}

function readUserNames(user: User | null) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : ""
  const metadataFirstName =
    typeof metadata.first_name === "string" ? metadata.first_name.trim() : fullName.split(" ")[0] ?? ""
  const metadataLastName =
    typeof metadata.last_name === "string"
      ? metadata.last_name.trim()
      : fullName.split(" ").slice(1).join(" ")
  const email = user?.email ?? ""
  const fallbackSegments = (email.split("@")[0] ?? "")
    .split(/[._-]/)
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))

  return {
    firstName: metadataFirstName || fallbackSegments[0] || "",
    lastName: metadataLastName || fallbackSegments.slice(1).join(" ") || "",
  }
}

function buildProfileInsert(user: User): DbTables["assigned_user_profiles"]["Insert"] {
  const names = readUserNames(user)
  const email = user.email ?? ""
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix"

  return {
    user_id: user.id,
    email,
    first_name: names.firstName,
    last_name: names.lastName,
    display_name: buildAssignedDisplayName(names.firstName, names.lastName, email),
    avatar_url: null,
    phone: null,
    timezone,
    onboarding_completed: false,
  }
}

export function slugifyAssignedValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function getDefaultOrganization(admin: AdminClient) {
  const result = await admin
    .from("assigned_organizations")
    .select("id, name, slug")
    .eq("slug", "samaya")
    .maybeSingle<AssignedOrganizationRow>()

  if (result.error) {
    throw result.error
  }

  return result.data ?? null
}

export async function ensureAssignedAccessRecords(user: User, admin = createAdminClient()) {
  const profileInsert = buildProfileInsert(user)

  const { error: profileError } = await admin.from("assigned_user_profiles").upsert(profileInsert, {
    onConflict: "user_id",
    ignoreDuplicates: true,
  })

  if (profileError) {
    throw profileError
  }

  const organization = await getDefaultOrganization(admin)

  if (!organization) {
    return
  }

  const membershipResult = await admin
    .from("assigned_memberships")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>()

  if (membershipResult.error) {
    throw membershipResult.error
  }

  if (membershipResult.data) {
    return
  }

  const { error: membershipError } = await admin.from("assigned_memberships").insert({
    organization_id: organization.id,
    user_id: user.id,
    access_level: "employee",
    is_admin: false,
    status: "active",
    availability: "available",
  })

  if (membershipError) {
    throw membershipError
  }
}

export async function getBootstrapAvailability(
  organizationId: string | null,
  admin = createAdminClient()
) {
  if (!organizationId) {
    return false
  }

  const countResult = await admin
    .from("assigned_memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("access_level", "admin")

  if (countResult.error) {
    throw countResult.error
  }

  return (countResult.count ?? 0) === 0
}

export async function getAssignedAccessContext(
  user: User | null,
  admin = createAdminClient()
): Promise<AssignedAccessContext> {
  if (!user) {
    return {
      ...createEmptyAssignedAccessSnapshot(),
      user: null,
      membershipId: null,
      organizationId: null,
      memberStatus: null,
      availability: null,
    }
  }

  await ensureAssignedAccessRecords(user, admin)

  const [profileResult, membershipResult] = await Promise.all([
    admin
      .from("assigned_user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single<AssignedUserProfileRow>(),
    admin
      .from("assigned_memberships")
      .select("*")
      .eq("user_id", user.id)
      .single<AssignedMembershipRow>(),
  ])

  if (profileResult.error) {
    throw profileResult.error
  }

  if (membershipResult.error) {
    throw membershipResult.error
  }

  const membership = membershipResult.data
  const profile = profileResult.data
  const effectiveAccessLevel = membership.access_level as AssignedAccessLevel

  const [organizationResult, teamResult, positionResult, managerProfileResult, memberProjectsResult] = await Promise.all([
    admin
      .from("assigned_organizations")
      .select("id, name, slug")
      .eq("id", membership.organization_id)
      .single<AssignedOrganizationRow>(),
    membership.team_id
      ? admin
          .from("assigned_teams")
          .select("id, name")
          .eq("id", membership.team_id)
          .maybeSingle<Pick<AssignedTeamRow, "id" | "name">>()
      : effectiveAccessLevel === "admin"
        ? admin
            .from("assigned_teams")
            .select("id, name")
            .eq("organization_id", membership.organization_id)
            .eq("slug", ASSIGNED_ADMIN_TEAM_SLUG)
            .maybeSingle<Pick<AssignedTeamRow, "id" | "name">>()
        : Promise.resolve({ data: null, error: null }),
    membership.position_id
      ? admin
          .from("assigned_positions")
          .select("id, name")
          .eq("id", membership.position_id)
          .maybeSingle<Pick<AssignedPositionRow, "id" | "name">>()
      : Promise.resolve({ data: null, error: null }),
    membership.manager_user_id
      ? admin
          .from("assigned_user_profiles")
          .select("user_id, display_name")
          .eq("user_id", membership.manager_user_id)
          .maybeSingle<Pick<AssignedUserProfileRow, "user_id" | "display_name">>()
      : Promise.resolve({ data: null, error: null }),
    admin
      .from("assigned_member_projects")
      .select("project_id, is_primary")
      .eq("membership_id", membership.id),
  ])

  if (organizationResult.error) {
    throw organizationResult.error
  }

  if (teamResult.error) {
    throw teamResult.error
  }

  if (positionResult.error) {
    throw positionResult.error
  }

  if (managerProfileResult.error) {
    throw managerProfileResult.error
  }

  if (memberProjectsResult.error) {
    throw memberProjectsResult.error
  }

  const bootstrapAvailable = await getBootstrapAvailability(membership.organization_id, admin)
  const memberProjects = (memberProjectsResult.data ?? []) as Array<{
    project_id: string
    is_primary: boolean
  }>
  const projectIds = memberProjects.map((entry) => entry.project_id)
  const projectResult = projectIds.length > 0
    ? await admin
        .from("assigned_projects")
        .select("id, name, location_text")
        .in("id", projectIds)
    : { data: [], error: null }

  if (projectResult.error) {
    throw projectResult.error
  }

  const projectMap = new Map(
    ((projectResult.data ?? []) as Array<Pick<AssignedProjectRow, "id" | "name" | "location_text">>)
      .map((project) => [project.id, project])
  )
  const projects = memberProjects
    .map((entry) => projectMap.get(entry.project_id))
    .filter((project): project is Pick<AssignedProjectRow, "id" | "name" | "location_text"> => Boolean(project))
    .map((project) => ({
      id: project.id,
      name: project.name,
      locationText: project.location_text,
    }))
  const resolvedTeam = teamResult.data ? { id: teamResult.data.id, label: teamResult.data.name } : null

  return {
    user,
    membershipId: membership.id,
    organizationId: membership.organization_id,
    memberStatus: membership.status,
    availability: membership.availability,
    profile: {
      userId: user.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      displayName: profile.display_name || buildAssignedDisplayName(profile.first_name, profile.last_name, profile.email),
      avatarUrl: profile.avatar_url,
      phone: profile.phone,
      timezone: profile.timezone,
    },
    accessLevel: effectiveAccessLevel,
    isAdmin: effectiveAccessLevel === "admin",
    onboardingCompleted: profile.onboarding_completed,
    organization: organizationResult.data,
    permissions: getPermissionsForAssignedAccessLevel(effectiveAccessLevel),
    bootstrapAvailable,
    team: resolvedTeam,
    position: positionResult.data ? { id: positionResult.data.id, label: positionResult.data.name } : null,
    manager: managerProfileResult.data
      ? { id: managerProfileResult.data.user_id, label: managerProfileResult.data.display_name }
      : null,
    projects,
    awaitingAssignment:
      effectiveAccessLevel === "admin"
        ? false
        : !resolvedTeam || !membership.position_id || projects.length === 0,
  }
}

export async function deleteOwnAssignedAccount(
  user: User | null,
  admin = createAdminClient()
) {
  requireAuthenticatedUser(user)

  const result = await admin.auth.admin.deleteUser(user.id)

  if (result.error) {
    throw result.error
  }
}

export async function deleteAssignedUser(
  user: User | null,
  targetUserId: string,
  admin = createAdminClient()
) {
  requireAuthenticatedUser(user)

  if (targetUserId === user.id) {
    throw new Error("Delete your own account from Settings.")
  }

  const access = await getAssignedAccessContext(user, admin)

  if (!access.permissions.includes("edit_users")) {
    throw new Error("You do not have access to delete users.")
  }

  const result = await admin.auth.admin.deleteUser(targetUserId)

  if (result.error) {
    throw result.error
  }
}
