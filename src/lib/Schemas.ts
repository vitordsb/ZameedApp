import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
export const registerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha muito curta"),
  cpf: z.string().min(11, "CPF inválido").optional(),
  cnpj: z.string().min(14).optional(),
  gender: z.string().optional(),
  birth: z.string(),
  type: z.enum(["contratante", "prestador"]),
  termos_aceitos: z.literal(true, { errorMap: () => ({ message: "É preciso aceitar os termos" }) }),
});

