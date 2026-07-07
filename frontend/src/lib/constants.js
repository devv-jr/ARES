export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const MODE_OPTIONS = [
  { value: "learning", label: "Learning", description: "Tutoría y explicación" },
  { value: "blue_team", label: "Blue Team", description: "Defensa y hardening" },
  { value: "red_team", label: "Red Team", description: "Pentesting ético" },
  { value: "developer", label: "Developer", description: "DevSecOps y código" },
]

export const MODE_LABELS = MODE_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.label
  return accumulator
}, {})
