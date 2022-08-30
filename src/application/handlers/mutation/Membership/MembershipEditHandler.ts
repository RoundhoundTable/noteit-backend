import { Membership, PrismaClient, Roles, User } from "@prisma/client";
import { GraphQLError } from "graphql";
import { MutationHandlerFunc, EditResult } from "../../../types/Handlers";

export const MembershipEditHandler: MutationHandlerFunc<
  Membership,
  EditResult
> = async (payload: Membership, prisma: PrismaClient, user: User, schema) => {
  await schema.validateAsync(payload);

  const notebook = await prisma.notebook.findUnique({
    where: {
      name: payload.notebookName,
    },
  });

  if (!notebook) throw new GraphQLError("Not found");

  const target = await prisma.membership.findUnique({
    where: {
      username_notebookName: {
        notebookName: payload.notebookName,
        username: payload.username,
      },
    },
  });

  if (!target) throw new GraphQLError("Not found");

  const current = await prisma.membership.findUnique({
    where: {
      username_notebookName: {
        notebookName: payload.notebookName,
        username: user.username,
      },
    },
  });

  if (current.role !== Roles.OWNER) throw new GraphQLError("Forbidden");

  const membership = await prisma.membership.update({
    where: {
      username_notebookName: {
        notebookName: payload.notebookName,
        username: payload.username,
      },
    },
    data: {
      role: payload.role,
    },
  });

  return { edited: Boolean(membership) };
};
