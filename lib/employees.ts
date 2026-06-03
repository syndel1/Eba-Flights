import type { PassengerInfo } from "@/lib/duffel"

export interface Employee {
  initials: string
  displayName: string
  legalName: string
  firstName: string
  lastName: string
  email: string
  country: string
  // TODO: replace with real data from Supabase once collected
  dateOfBirth: string  // placeholder for Duffel sandbox
  gender: "m" | "f"   // placeholder for Duffel sandbox
}

export const employees: Employee[] = [
  { initials: "CZ", displayName: "Camila Z.", legalName: "Camila Sayuri Zancanella",    firstName: "Camila Sayuri", lastName: "Zancanella",        email: "camila@domu.ai",    country: "BR", dateOfBirth: "1995-03-15", gender: "f" },
  { initials: "ND", displayName: "Nick D.",   legalName: "Nicolas Felipe Diaz Rodriguez", firstName: "Nicolas Felipe", lastName: "Diaz Rodriguez",  email: "nicolas@domu.ai",   country: "CO", dateOfBirth: "1992-07-22", gender: "m" },
  { initials: "IC", displayName: "Isaac C.",  legalName: "Robert Choate",               firstName: "Robert",        lastName: "Choate",            email: "isaac@domu.ai",     country: "US", dateOfBirth: "1994-11-05", gender: "m" },
  { initials: "AC", displayName: "Aidan C.",  legalName: "Aidan Connors",               firstName: "Aidan",         lastName: "Connors",           email: "aidan@domu.ai",     country: "US", dateOfBirth: "1996-04-18", gender: "m" },
  { initials: "AJ", displayName: "Ashley J.", legalName: "Ashley Jinju Jung",           firstName: "Ashley Jinju",  lastName: "Jung",              email: "ashley@domu.ai",    country: "US", dateOfBirth: "1993-09-30", gender: "f" },
  { initials: "DH", displayName: "David H.",  legalName: "David Helwich",               firstName: "David",         lastName: "Helwich",           email: "david@domu.ai",     country: "US", dateOfBirth: "1990-12-14", gender: "m" },
  { initials: "AY", displayName: "Arushi Y.", legalName: "Arushi Yana Thakur",          firstName: "Arushi Yana",   lastName: "Thakur",            email: "arushi@domu.ai",    country: "IN", dateOfBirth: "1997-06-25", gender: "f" },
  { initials: "AH", displayName: "Apoorva H.",legalName: "Apoorva Herle",               firstName: "Apoorva",       lastName: "Herle",             email: "apoorva@domu.ai",   country: "IN", dateOfBirth: "1998-02-08", gender: "f" },
  { initials: "PD", displayName: "Pedro D.",  legalName: "Pedro Dias",                  firstName: "Pedro",         lastName: "Dias",              email: "pedro@domu.ai",     country: "US", dateOfBirth: "1991-08-17", gender: "m" },
  { initials: "JA", displayName: "Jewel A.",  legalName: "Jewel Aw",                    firstName: "Jewel",         lastName: "Aw",                email: "jewel@domu.ai",     country: "SG", dateOfBirth: "1994-01-29", gender: "f" },
  { initials: "SM", displayName: "Sebastian M.", legalName: "Sebastian Mellen",         firstName: "Sebastian",     lastName: "Mellen",            email: "sebastian@domu.ai", country: "US", dateOfBirth: "1989-05-12", gender: "m" },
  { initials: "AS", displayName: "Alexandre S.", legalName: "Alexandre Sfez",           firstName: "Alexandre",     lastName: "Sfez",              email: "alexsfez@domu.ai",  country: "US", dateOfBirth: "1988-10-03", gender: "m" },
  { initials: "CL", displayName: "Cheryl L.", legalName: "Cheryl Lim",                  firstName: "Cheryl",        lastName: "Lim",               email: "cheryl@domu.ai",    country: "SG", dateOfBirth: "1996-07-11", gender: "f" },
  { initials: "KT", displayName: "Kai T.",    legalName: "Kai Takami",                  firstName: "Kai",           lastName: "Takami",            email: "kai@domu.ai",       country: "JP", dateOfBirth: "1993-03-28", gender: "m" },
  { initials: "AL", displayName: "Angel L.",  legalName: "Angel Yahir Loredo Lopez",    firstName: "Angel Yahir",   lastName: "Loredo Lopez",      email: "angel@domu.ai",     country: "MX", dateOfBirth: "1997-11-20", gender: "m" },
  { initials: "VZ", displayName: "Vitor Z.",  legalName: "Vitor Hiroshi Zancanella",    firstName: "Vitor Hiroshi", lastName: "Zancanella",        email: "vitor@domu.ai",     country: "BR", dateOfBirth: "1994-06-07", gender: "m" },
  { initials: "AP", displayName: "Alejandra P.", legalName: "Maria Alejandra Pulido",   firstName: "Maria Alejandra", lastName: "Pulido",          email: "alejandra@domu.ai", country: "CO", dateOfBirth: "1995-08-14", gender: "f" },
  { initials: "SC", displayName: "Syndel C.", legalName: "Syndel Callisaya",            firstName: "Syndel",        lastName: "Callisaya",         email: "syndel@domu.ai",    country: "BO", dateOfBirth: "1997-04-10", gender: "f" },
  { initials: "MR", displayName: "Manuel R.", legalName: "Manuel Santiago Romero Aragon", firstName: "Manuel Santiago", lastName: "Romero Aragon", email: "manuel@domu.ai",    country: "CO", dateOfBirth: "1999-07-26", gender: "m" },
  { initials: "AM", displayName: "Adriana M.", legalName: "Adriana Maria Muñoz Vergara", firstName: "Adriana Maria", lastName: "Muñoz Vergara",   email: "adriana@domu.ai",   country: "CO", dateOfBirth: "1993-10-01", gender: "f" },
  { initials: "FC", displayName: "Felipe C.", legalName: "Andres Felipe Cortes Bello",  firstName: "Andres Felipe", lastName: "Cortes Bello",      email: "felipe@domu.ai",    country: "CO", dateOfBirth: "1992-10-01", gender: "m" },
  { initials: "JG", displayName: "Juan G.",   legalName: "Juan Pablo Garzon Parra",     firstName: "Juan Pablo",    lastName: "Garzon Parra",      email: "juan@domu.ai",      country: "CO", dateOfBirth: "1996-11-04", gender: "m" },
  { initials: "SM2", displayName: "Sofia M.", legalName: "Julieth Sofia Moreno Ahumada", firstName: "Julieth Sofia", lastName: "Moreno Ahumada",   email: "sofia@domu.ai",     country: "CO", dateOfBirth: "1998-11-07", gender: "f" },
  { initials: "AF", displayName: "Ana F.",    legalName: "Ana Maria Fonseca",           firstName: "Ana Maria",     lastName: "Fonseca",           email: "ana@domu.ai",       country: "CO", dateOfBirth: "1995-01-28", gender: "f" },
  { initials: "LZ", displayName: "Lucas Z.",  legalName: "Lucas Kenji Zancanella",      firstName: "Lucas Kenji",   lastName: "Zancanella",        email: "lucas@domu.ai",     country: "BR", dateOfBirth: "1997-11-07", gender: "m" },
  { initials: "ML", displayName: "Marco L.",  legalName: "Marco Antonio Lopez",         firstName: "Marco Antonio", lastName: "Lopez",             email: "marco@domu.ai",     country: "MX", dateOfBirth: "1993-03-14", gender: "m" },
  { initials: "MR2", displayName: "Miguel R.", legalName: "Miguel Rios Olaya",          firstName: "Miguel",        lastName: "Rios Olaya",        email: "miguel@domu.ai",    country: "CO", dateOfBirth: "1994-01-01", gender: "m" },
]

export function findEmployee(query: string): Employee | undefined {
  const q = query.toLowerCase().trim()
  return employees.find(
    (e) =>
      e.initials.toLowerCase() === q ||
      e.displayName.toLowerCase().includes(q) ||
      e.legalName.toLowerCase().includes(q) ||
      e.email.toLowerCase() === q
  )
}

export function employeeToPassenger(e: Employee): PassengerInfo {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    dateOfBirth: e.dateOfBirth,
    gender: e.gender,
  }
}
