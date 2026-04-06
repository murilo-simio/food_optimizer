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
CREATE TABLE "nutrient_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "nutrient" TEXT NOT NULL,
    "targetChange" REAL NOT NULL,
    "maxCostDelta" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultCost" REAL,
    "resultFoods" TEXT,
    CONSTRAINT "nutrient_adjustments_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "diets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "food_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "foodId" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "weightG" REAL NOT NULL,
    "pricePerKg" REAL NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_prices_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ALGORITHM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalCalories" REAL NOT NULL,
    "totalProteinG" REAL NOT NULL,
    "totalFatG" REAL NOT NULL,
    "totalCarbsG" REAL NOT NULL,
    "estimatedCost" REAL,
    "context" TEXT,
    "aiReasoning" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "diets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "food_in_diets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dietId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "grams" REAL NOT NULL,
    "mealSlot" TEXT NOT NULL,
    CONSTRAINT "food_in_diets_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "diets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "food_in_diets_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedDietId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_messages_relatedDietId_fkey" FOREIGN KEY ("relatedDietId") REFERENCES "diets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blood_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL,
    "lab" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blood_exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blood_exam_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "marker" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "refMin" REAL,
    "refMax" REAL,
    "status" TEXT,
    "note" TEXT,
    CONSTRAINT "blood_exam_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "blood_exams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "body_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "bodyFatPercentage" REAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "body_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "intensity" TEXT NOT NULL,
    "notes" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exercise_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealSlot" TEXT NOT NULL,
    CONSTRAINT "meal_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meal_log_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealLogId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "grams" REAL NOT NULL,
    CONSTRAINT "meal_log_items_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "meal_logs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meal_log_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "taste_profiles_userId_key" ON "taste_profiles"("userId");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE INDEX "food_prices_foodId_collectedAt_idx" ON "food_prices"("foodId", "collectedAt");

-- CreateIndex
CREATE INDEX "food_prices_site_idx" ON "food_prices"("site");

-- CreateIndex
CREATE INDEX "diets_userId_status_idx" ON "diets"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "food_in_diets_dietId_foodId_mealSlot_key" ON "food_in_diets"("dietId", "foodId", "mealSlot");

-- CreateIndex
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_relatedDietId_idx" ON "chat_messages"("relatedDietId");

-- CreateIndex
CREATE INDEX "blood_exams_userId_collectedAt_idx" ON "blood_exams"("userId", "collectedAt");

-- CreateIndex
CREATE INDEX "body_records_userId_recordedAt_idx" ON "body_records"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "exercise_logs_userId_loggedAt_idx" ON "exercise_logs"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "meal_logs_userId_date_idx" ON "meal_logs"("userId", "date");
