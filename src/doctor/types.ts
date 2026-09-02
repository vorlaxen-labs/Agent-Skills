export interface DoctorCheck {
  name: string;
  status: "ok" | "warn" | "error" | "info";
  message: string;
}
