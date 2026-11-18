require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

const categories = [
  "Technology",
  "Music",
  "Language",
  "Cooking",
  "Fitness",
  "Art",
];

const skills = [
  { name: "Python", level: "BEGINNER", category: "Technology" },
  { name: "JavaScript", level: "INTERMEDIATE", category: "Technology" },
  { name: "Cybersecurity", level: "ADVANCED", category: "Technology" },
  { name: "Guitar", level: "BEGINNER", category: "Music" },
  { name: "Piano", level: "INTERMEDIATE", category: "Music" },
  { name: "Music Theory", level: "ADVANCED", category: "Music" },
  { name: "Spanish", level: "BEGINNER", category: "Language" },
  { name: "French", level: "INTERMEDIATE", category: "Language" },
  { name: "Baking", level: "BEGINNER", category: "Cooking" },
  { name: "Italian Cooking", level: "ADVANCED", category: "Cooking" },
  { name: "Yoga", level: "BEGINNER", category: "Fitness" },
  { name: "HIIT Training", level: "INTERMEDIATE", category: "Fitness" },
  { name: "Sketching", level: "BEGINNER", category: "Art" },
  { name: "Digital Art", level: "INTERMEDIATE", category: "Art" },
  { name: "Photography", level: "ADVANCED", category: "Art" },
];

const users = [
  { name: "SkillSwap Admin", email: "admin@skillswap.com", password: "Admin@123", role: "ADMIN" },
  { name: "Aarav Shah", email: "aarav@skillswap.com", password: "User@123", role: "USER" },
  { name: "Maya Patel", email: "maya@skillswap.com", password: "User@123", role: "USER" },
  { name: "Leo Chen", email: "leo@skillswap.com", password: "User@123", role: "USER" },
  { name: "Sophia Williams", email: "sophia@skillswap.com", password: "User@123", role: "USER" },
  { name: "Noah Kim", email: "noah@skillswap.com", password: "User@123", role: "USER" },
];

/**
 * Seed categories, skills, users, and user skill offerings.
 */
async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const categoryRecords = await prisma.category.findMany({
    where: { name: { in: categories } },
  });
  const categoryByName = new Map(categoryRecords.map((category) => [category.name, category]));

  const skillRecords = new Map();
  for (const skill of skills) {
    const category = categoryByName.get(skill.category);
    const record = await prisma.skill.upsert({
      where: { name: skill.name },
      update: { level: skill.level, categoryId: category.id },
      create: { name: skill.name, level: skill.level, categoryId: category.id },
    });
    skillRecords.set(skill.name, record);
  }

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const userPassword = await bcrypt.hash("User@123", 10);

  const userRecords = new Map();
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.role === "ADMIN" ? adminPassword : userPassword,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: user.role === "ADMIN" ? adminPassword : userPassword,
        role: user.role,
        coins: user.role === "ADMIN" ? 50 : 50,
      },
    });
    userRecords.set(user.email, record);
  }

  const offerings = [
    ["aarav@skillswap.com", "Python", "TEACH", 25],
    ["aarav@skillswap.com", "Spanish", "LEARN", 15],
    ["maya@skillswap.com", "Guitar", "TEACH", 20],
    ["maya@skillswap.com", "JavaScript", "LEARN", 30],
    ["leo@skillswap.com", "JavaScript", "TEACH", 35],
    ["leo@skillswap.com", "Piano", "LEARN", 20],
    ["sophia@skillswap.com", "Yoga", "TEACH", 18],
    ["sophia@skillswap.com", "Photography", "LEARN", 40],
    ["noah@skillswap.com", "Baking", "TEACH", 22],
    ["noah@skillswap.com", "Cybersecurity", "LEARN", 40],
  ];

  for (const [email, skillName, type, hourlyCoinRate] of offerings) {
    const user = userRecords.get(email);
    const skill = skillRecords.get(skillName);

    await prisma.userSkill.upsert({
      where: {
        userId_skillId_type: {
          userId: user.id,
          skillId: skill.id,
          type,
        },
      },
      update: { hourlyCoinRate },
      create: {
        userId: user.id,
        skillId: skill.id,
        type,
        hourlyCoinRate,
      },
    });
  }

  console.log("SkillSwap seed completed.");
}

main()
  .catch((error) => {
    console.error("SkillSwap seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = main;
