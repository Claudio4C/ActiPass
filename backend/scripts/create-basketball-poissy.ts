import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const orgName = 'Basketball Poissy';
  const orgSlug = slugify(orgName);
  const userEmail = 'kyllian.creppy@outlook.fr';

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL manquant. Crée un fichier backend/.env (ou exporte la variable) puis relance le script.'
    );
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    throw new Error(
      `Utilisateur introuvable pour l'email ${userEmail}. (Il doit exister en base avant d'assigner un rôle.)`
    );
  }

  const memberRole = await prisma.role.findFirst({
    where: {
      type: 'member',
      space: 'club_360',
    },
  });
  if (!memberRole) {
    throw new Error(
      "Rôle 'Adhérent' introuvable (type=member, space=club_360). Lance d'abord le seed des rôles/permissions."
    );
  }

  const organisation = await prisma.organisation.upsert({
    where: { slug: orgSlug },
    update: {
      name: orgName,
      description: 'Club de basketball (données de test)',
      address: '12 Rue du Stade, 78300 Poissy',
      city: 'Poissy',
      zip_code: '78300',
      country: 'France',
      email: 'contact@basketball-poissy.fr',
      phone: '01 39 00 00 00',
      website_url: 'https://basketball-poissy.fr',
      logo_url: 'https://picsum.photos/seed/basketball-poissy/256/256',
      status: 'active',
      is_public: true,
      updated_at: new Date(),
    },
    create: {
      name: orgName,
      slug: orgSlug,
      type: 'sport',
      description: 'Club de basketball (données de test)',
      address: '12 Rue du Stade, 78300 Poissy',
      city: 'Poissy',
      zip_code: '78300',
      country: 'France',
      latitude: 48.9299,
      longitude: 2.0479,
      email: 'contact@basketball-poissy.fr',
      phone: '01 39 00 00 00',
      website_url: 'https://basketball-poissy.fr',
      logo_url: 'https://picsum.photos/seed/basketball-poissy/256/256',
      created_by_id: user.id,
      status: 'active',
      is_public: true,
    },
  });

  const existingMembership = await prisma.membership.findFirst({
    where: {
      user_id: user.id,
      organisation_id: organisation.id,
      left_at: null,
    },
  });

  const membership = existingMembership
    ? await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          role_id: memberRole.id,
          validated: true,
          status: 'active',
          is_main_membership: true,
          updated_at: new Date(),
        },
      })
    : await prisma.membership.create({
        data: {
          user_id: user.id,
          organisation_id: organisation.id,
          role_id: memberRole.id,
          validated: true,
          status: 'active',
          is_main_membership: true,
        },
      });

  console.log('✅ Organisation prête:', { id: organisation.id, name: organisation.name, slug: organisation.slug });
  console.log('✅ Membership prêt:', {
    membershipId: membership.id,
    userEmail,
    organisationId: organisation.id,
    role: memberRole.name,
    roleType: memberRole.type,
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

