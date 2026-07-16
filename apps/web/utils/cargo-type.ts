export function cargoTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "CONTAINER":
      return "Container";
    case "GERAL":
      return "Carga Geral";
    case "GRANEL":
      return "Granel";
    default:
      return "—";
  }
}
