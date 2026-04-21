export const appConfig = {
  productName: "Assigned",
  companyName: "Samaya",
  productTagline: "Task management and assignments for Samaya teams",
  productDescription:
    "Assigned is Samaya's task management and assignment platform, built to coordinate projects, teams, and daily collaboration in one modular workspace.",
  exports: {
    stateFileName: "assigned-export.json",
  },
  cloud: {
    stateTable: "assigned_user_states",
  },
} as const
