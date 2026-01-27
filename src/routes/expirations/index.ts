import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { ExpirationAlertSchema } from "../../schemas/expirationSchema";
import { driverService } from "../../services/driverService";
import { emailService } from "../../services/emailService";
import { z } from "zod";
import dayjs from "dayjs";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/alerts",
    {
      onRequest: [fastify.authenticate],
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
              message: `${label} expired`,
              entity: "Driver",
              entityName: `${d.firstName} ${d.lastName}`,
              entityId: d.id,
              dueDate: date,
            });
          } else if (diff <= 30) {
            alerts.push({
              type: "warning",
              message: `${label} expiring soon`,
              entity: "Driver",
              entityName: `${d.firstName} ${d.lastName}`,
              entityId: d.id,
              dueDate: date,
            });
          }
        };

        check(d.license?.expiryDate, "License");
        check(d.medical?.expiryDate, "Medical");
        check(d.mvr?.expiryDate, "MVR");
      });

      return alerts;
    }
  );

  server.post(
    "/send-notifications",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Send expiration notifications via Resend",
        tags: ["Expiration"],
        body: z.object({
          notifications: z.array(
            z.object({
              driverId: z.string(),
              driverName: z.string(),
              email: z.string().email(),
              documentType: z.string(),
              dueDate: z.string(),
              daysLeft: z.number(),
            })
          ),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            sentCount: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const { notifications } = request.body;

      let sentCount = 0;
      for (const notification of notifications) {
        try {
          await emailService.sendExpirationNotification(
            notification.email,
            notification.driverName,
            notification.documentType,
            notification.dueDate,
            notification.daysLeft
          );
          sentCount++;
        } catch (error) {
          request.log.error(
            { error, notification },
            "Failed to send some notifications"
          );
        }
      }

      return { success: true, sentCount };
    }
  );
}
