export const appConfig = {
  productName: "Assigned",
  companyName: "Samaya",
  productTagline: "Collaborative task assignment and execution",
  productDescription:
    "Assigned is a collaborative task management workspace for assigning work, tracking progress, and keeping teams aligned across tasks, projects, and daily operations.",
  exports: {
    stateFileName: "assigned-export.json",
  },
  cloud: {
    stateTable: "assigned_user_states",
  },
} as const
