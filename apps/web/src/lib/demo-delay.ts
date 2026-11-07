// shortcut: delay artificial de DEMO para verificar skeletons en la revisión del
// martes — quitar (o reducir a 0) tras la demo.
export const sleepDemo = (ms = 3000) => new Promise<void>((resolve) => setTimeout(resolve, ms));
