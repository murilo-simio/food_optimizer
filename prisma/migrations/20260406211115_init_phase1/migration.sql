-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "bodyFatPercentage" REAL,
    "state" TEXT,
    "city" TEXT,
    "activityLevel" TEXT NOT NULL,
    "exerciseFrequency" INTEGER NOT NULL,
    "primaryExerciseType" TEXT,
    "exerciseDurationMin" INTEGER,
    "exerciseIntensity" TEXT,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 3,
    "workRoutine" TEXT NOT NULL,
    "dietaryRestrictions" TEXT NOT NULL DEFAULT 'NONE',
    "weeklyFoodBudget" REAL,
    "goal" TEXT NOT NULL,
    "tdee" REAL,
    "targetCalories" REAL,
    "targetProteinG" REAL,
    "targetFatG" REAL,
    "targetCarbsG" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "onboarding_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "onboarding_answers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taste_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stapleFoods" TEXT NOT NULL DEFAULT '[]',
    "aversions" TEXT NOT NULL DEFAULT '[]',
    "sweetPreference" INTEGER NOT NULL DEFAULT 3,
    "saltyPreference" INTEGER NOT NULL DEFAULT 3,
    "spicyTolerance" INTEGER NOT NULL DEFAULT 2,
    "cookingSkill" INTEGER NOT NULL DEFAULT 3,
    "cookingTime" INTEGER,
    "favoriteFoods" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "taste_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "caloriesKcal" REAL NOT NULL,
    "proteinG" REAL NOT NULL,
    "fatG" REAL NOT NULL,
    "carbsG" REAL NOT NULL,
    "fiberG" REAL NOT NULL DEFAULT 0,
    "sugarG" REAL NOT NULL DEFAULT 0,
    "vitaminA_UG" REAL NOT NULL DEFAULT 0,
    "vitaminC_MG" REAL NOT NULL DEFAULT 0,
    "vitaminD_UG" REAL NOT NULL DEFAULT 0,
    "vitaminE_MG" REAL NOT NULL DEFAULT 0,
    "vitaminK_UG" REAL NOT NULL DEFAULT 0,
    "vitaminB1_MG" REAL NOT NULL DEFAULT 0,
    "vitaminB2_MG" REAL NOT NULL DEFAULT 0,
    "vitaminB3_MG" REAL NOT NULL DEFAULT 0,
    "vitaminB5_MG" REAL NOT NULL DEFAULT 0,
    "vitaminB6_MG" REAL NOT NULL DEFAULT 0,
    "vitaminB9_UG" REAL NOT NULL DEFAULT 0,
    "vitaminB12_UG" REAL NOT NULL DEFAULT 0,
    "calcium_MG" REAL NOT NULL DEFAULT 0,
    "iron_MG" REAL NOT NULL DEFAULT 0,
    "magnesium_MG" REAL NOT NULL DEFAULT 0,
    "zinc_MG" REAL NOT NULL DEFAULT 0,
    "potassium_MG" REAL NOT NULL DEFAULT 0,
    "sodium_MG" REAL NOT NULL DEFAULT 0,
    "selenium_UG" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "taste_profiles_userId_key" ON "taste_profiles"("userId");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");
