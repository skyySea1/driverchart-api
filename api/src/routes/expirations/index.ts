import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { ExpirationAlertSchema } from "../../schemas/expirationSchema";
import { driverService } from "../../services/driverService";
import { z } from "zod";
import dayjs from "dayjs";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/alerts",
    {
      schema: {
        description: "Get all compliance alerts",
        tags: ["Expiration"],
        response: {
          200: z.array(ExpirationAlertSchema),
        },
      },
    },
    async () => {
      const drivers = await driverService.getAll();
      const alerts: any[] = [];
      const today = dayjs();

      drivers.forEach((d) => {
        const check = (date: string | undefined, label: string) => {
          if (!date) return;
          const due = dayjs(date);
          const diff = due.diff(today, "day");

          if (diff < 0) {
            alerts.push({
              type: "critical",
              message: `${d.lastName}: ${label} expired`,
              entity: `${d.firstName} ${d.lastName}`,
              dueDate: date,
            });
          } else if (diff <= 30) {
            alerts.push({
              type: "warning",
              message: `${d.firstName} ${d.lastName}: ${label} expiring soon`,
              entity: `${d.firstName} ${d.lastName}`,
              dueDate: date,
            });
          }
        };

        check(d.cdl?.expiryDate, "CDL");
        check(d.medical?.expiryDate, "Medical");
        check(d.mvr?.expiryDate, "MVR");
      });

      return alerts;
    }
  );
}
