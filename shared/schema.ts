
import {
  mysqlTable,
  varchar,
  int,
  boolean,
  double,
  text,
  datetime,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  endereco: varchar("endereco", { length: 255 }).notNull(),
  about: varchar("about", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("contratante"),
  termos_aceitos: boolean("termos_aceitos").notNull().default(false),
  is_email_verified: boolean("is_email_verified").notNull().default(false),
  perfil_completo: boolean("perfil_completo").notNull().default(false),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull()
});

// ---------- Users ----------
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    confirmPassword: z.string().min(6),
    type: z.enum(["contratante", "prestador"]),
    termos_aceitos: z.boolean(),
  });

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ---------- Service Providers ----------
export const providers = mysqlTable("providers", {
  providerId: int("provider_id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  profession: varchar("profession", { length: 255 }).notNull(),
  views_profile: int("views_profile").notNull().default(0),
  about: text("about"),
  rating_mid: double("rating_mid").notNull().default(0),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const insertProviderSchema = createInsertSchema(providers)
  .omit({ providerId: true, createdAt: true, updatedAt: true });

// ---------- Demands ----------
export const demands = mysqlTable("demands", {
  id_demand: int("id_demand").primaryKey().autoincrement(),
  id_user: int("id_user").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: double("price").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pendente"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const insertDemandSchema = createInsertSchema(demands)
  .omit({ id_demand: true, createdAt: true, updatedAt: true });

// ---------- Service Freelancer ----------
export const serviceFreelancers = mysqlTable("service_freelancers", {
  id_serviceFreelancer: int("id_serviceFreelancer").primaryKey().autoincrement(),
  id_provider: int("id_provider").notNull().references(() => providers.providerId),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: double("price").notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const insertServiceFreelancerSchema = createInsertSchema(serviceFreelancers)
  .omit({ id_serviceFreelancer: true, createdAt: true, updatedAt: true });

// ---------- Type Exports ----------
export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ServiceProvider = typeof providers.$inferSelect;
export type NewServiceProvider = z.infer<typeof insertProviderSchema>;
export type Demand = typeof demands.$inferSelect;
export type NewDemand = z.infer<typeof insertDemandSchema>;
export type ServiceFreelancer = typeof serviceFreelancers.$inferSelect;
export type NewServiceFreelancer = z.infer<typeof insertServiceFreelancerSchema>;

