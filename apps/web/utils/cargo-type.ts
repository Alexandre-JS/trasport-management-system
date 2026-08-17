export function cargoTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "CONTAINER":
      return "Container";
    case "GERAL":
      return "General Cargo";
    case "GRANEL":
      return "Granel";
    default:
      return "—";
  }
}
