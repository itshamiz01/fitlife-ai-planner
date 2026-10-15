import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Heart,
  Flame,
  Droplets,
  Dumbbell,
  Calendar,
  Utensils,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Info,
  User,
  Sliders,
  Scale,
  Target,
  Clock,
  ShieldAlert,
  Send,
  Plus,
  Minus,
  Check,
  ChevronDown,
  Share2,
  Award,
  Zap,
  BarChart3,
  Search,
  BookOpen
} from 'lucide-react';

const DEFAULT_PROFILE = {
  name: 'Alex Johnson',
  age: 29,
  sex: 'male', // 'male' | 'female'
  heightCm: 175,
  currentWeightKg: 78,
  targetWeightKg: 72,
  activityLevel: 'moderate', // 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active'
  primaryGoal: 'lose_weight', // 'lose_weight' | 'maintain' | 'gain_muscle'
  country: 'India',
  unitSystem: 'metric', // 'metric' | 'imperial'
  dietaryPreference: 'vegetarian', // 'vegetarian' | 'vegan' | 'eggetarian' | 'pescatarian' | 'non_vegetarian'
  allergies: ['Peanuts'],
  religiousRestrictions: 'None',
  preferredCuisines: ['Indian', 'Mediterranean'],
  foodBudget: 'moderate', // 'budget' | 'moderate' | 'premium'
  workoutPreference: 'mixed', // 'home' | 'gym' | 'mixed'
  fitnessExperience: 'intermediate', // 'beginner' | 'intermediate' | 'advanced'
  equipment: ['Dumbbells', 'Yoga Mat', 'Resistance Bands'],
  workoutDaysPerWeek: 4,
  sleepHours: 7.5,
  healthConditions: 'None',
  onboarded: true
};

// Activity multipliers for Mifflin-St Jeor TDEE calculation
const ACTIVITY_FACTORS = {
  sedentary: { label: 'Sedentary (Desk job, little movement)', factor: 1.2 },
  light: { label: 'Lightly Active (1-3 light sessions/week)', factor: 1.375 },
  moderate: { label: 'Moderately Active (3-5 sessions/week)', factor: 1.55 },
  active: { label: 'Very Active (6-7 intense sessions/week)', factor: 1.725 },
  extra_active: { label: 'Extremely Active (Athletic training/physical job)', factor: 1.9 }
};

const REGIONAL_MEALS = {
  vegetarian: [
    {
      day: 'Monday',
      meals: {
        breakfast: { name: 'Moong Dal Chilla with Mint Chutney', cal: 320, p: 18, c: 42, f: 8, fiber: 7, time: '15 min', ingredients: ['Yellow Moong Dal (60g)', 'Grated Paneer (30g)', 'Spinach & Spices', 'Olive oil (1 tsp)'], instructions: 'Grind soaked dal, add grated paneer and spinach. Cook on a non-stick tawa with light olive oil.' },
        morningSnack: { name: 'Roasted Spiced Makhana & Green Tea', cal: 140, p: 4, c: 24, f: 3, fiber: 4, time: '5 min', ingredients: ['Fox nuts / Makhana (30g)', 'Turmeric & Chaat masala', 'Green tea'], instructions: 'Dry roast makhana with a sprinkle of roasted cumin and chaat masala.' },
        lunch: { name: 'Paneer Bhurji with 2 Multigrain Rotis & Cucumber Salad', cal: 480, p: 26, c: 50, f: 18, fiber: 9, time: '20 min', ingredients: ['Low-fat Paneer (120g)', 'Onion, Tomato, Bell peppers', 'Multigrain Atta Rotis (2 pcs)', 'Cucumber (100g)'], instructions: 'Sauté chopped veggies with spices, scramble paneer. Serve hot with warm rotis and cucumber slices.' },
        eveningSnack: { name: 'Sprouted Kala Chana Chaat', cal: 180, p: 10, c: 28, f: 2, fiber: 8, time: '10 min', ingredients: ['Boiled Sprouted Black Chickpeas (80g)', 'Lemon juice, Onion, Tomato', 'Rock salt'], instructions: 'Toss boiled sprouts with diced red onion, tomato, lemon juice, and roasted cumin powder.' },
        dinner: { name: 'Tadka Yellow Dal, Steamed Brown Rice & Sautéed Beans', cal: 420, p: 20, c: 68, f: 6, fiber: 11, time: '25 min', ingredients: ['Toor / Moong Dal (50g dry)', 'Cooked Brown Rice (100g)', 'Green French Beans (100g)'], instructions: 'Boil dal with turmeric, temper lightly with cumin seeds and garlic. Serve alongside fiber-rich beans.' },
        postWorkout: { name: 'Plant Protein Shake with Chia Seeds', cal: 170, p: 24, c: 6, f: 4, fiber: 3, time: '3 min', ingredients: ['Pea/Brown Rice Protein (1 scoop)', 'Water / Almond milk (250ml)', 'Soaked Chia seeds (1 tsp)'], instructions: 'Shake thoroughly in a shaker bottle with ice cubes.' }
      }
    },
    {
      day: 'Tuesday',
      meals: {
        breakfast: { name: 'Rolled Oats Porridge with Walnuts & Flaxseed', cal: 340, p: 12, c: 52, f: 10, fiber: 8, time: '10 min', ingredients: ['Rolled Oats (50g)', 'Low-fat milk/Almond milk (200ml)', 'Crushed Walnuts (10g)', 'Ground Flaxseeds (1 tsp)'], instructions: 'Simmer oats in milk for 5 minutes. Top with crushed nuts and berries if available.' },
        morningSnack: { name: 'Fresh Apple with a Dash of Cinnamon', cal: 95, p: 1, c: 25, f: 0.3, fiber: 4.4, time: '2 min', ingredients: ['1 Medium Apple', 'Ceylon Cinnamon powder'], instructions: 'Slice apple and dust lightly with fragrant ground cinnamon.' },
        lunch: { name: 'Punjabi Rajma Masala, Quinoa/Brown Rice & Curd', cal: 510, p: 22, c: 76, f: 11, fiber: 13, time: '30 min', ingredients: ['Kidney Beans / Rajma (70g dry)', 'Cooked Quinoa/Rice (120g)', 'Probiotic Low-fat Dahi/Curd (100g)'], instructions: 'Pressure cook soaked rajma in onion-tomato ginger gravy. Accompany with warm grains and cooling curd.' },
        eveningSnack: { name: 'Handful Roasted Almonds & Herbal Infusion', cal: 160, p: 6, c: 6, f: 14, fiber: 3, time: '2 min', ingredients: ['Raw or dry roasted almonds (20g)', 'Chamomile or Tulsi tea'], instructions: 'Slowly enjoy crunchy almonds alongside unsweetened herbal infusion.' },
        dinner: { name: 'Grilled Tofu Steak with Stir-Fried Broccoli & Zucchini', cal: 390, p: 28, c: 22, f: 18, fiber: 8, time: '20 min', ingredients: ['Firm Tofu (150g)', 'Broccoli florets (100g)', 'Zucchini (80g)', 'Garlic, Soy sauce, Sesame oil (1 tsp)'], instructions: 'Marinate tofu slabs with ginger-garlic and light soy. Sear on a grill pan with stir-fried greens.' },
        postWorkout: { name: 'Curd & Berry Protein Cup', cal: 150, p: 16, c: 14, f: 2, fiber: 2, time: '3 min', ingredients: ['Greek yogurt or hung curd (150g)', 'Pomegranate seeds or blueberries (30g)'], instructions: 'Whip curd until creamy and fold in tart pomegranate arils.' }
      }
    },
    {
      day: 'Wednesday',
      meals: {
        breakfast: { name: 'Besan Vegetable Toast with Spiced Mint Curd Dip', cal: 330, p: 15, c: 45, f: 9, fiber: 6, time: '15 min', ingredients: ['Gram flour/Besan (40g)', 'Whole wheat or Sourdough Bread (2 slices)', 'Carrot, Capsicum, Coriander'], instructions: 'Whisk besan batter with finely chopped vegetables. Coat bread slices and shallow toast on skillet.' },
        morningSnack: { name: 'Coconut Water with Tender Malai', cal: 75, p: 1.5, c: 15, f: 1, fiber: 2, time: '1 min', ingredients: ['Fresh tender coconut water (250ml)'], instructions: 'Drink fresh for natural electrolyte replenishing.' },
        lunch: { name: 'Palak Paneer with 2 Jowar (Sorghum) Rotis & Sprout Salad', cal: 490, p: 25, c: 54, f: 17, fiber: 10, time: '25 min', ingredients: ['Blanched Spinach puree (150g)', 'Paneer cubes (100g)', 'Jowar flour rotis (2)', 'Mixed sprouts (50g)'], instructions: 'Simmer blanched spinach puree with garlic and paneer cubes. Pair with gluten-free Jowar flatbreads.' },
        eveningSnack: { name: 'Boiled Sweet Potato with Chaat Seasoning', cal: 140, p: 2.5, c: 32, f: 0.2, fiber: 4, time: '10 min', ingredients: ['Steamed Sweet Potato (120g)', 'Lemon juice & Rock salt'], instructions: 'Dice steamed sweet potatoes, dress with zesty lemon juice and roasted spices.' },
        dinner: { name: 'Panchmel Dal Khichdi with Roasted Papad & Ghee (1/2 tsp)', cal: 430, p: 19, c: 68, f: 8, fiber: 9, time: '25 min', ingredients: ['Mixed Lentils (40g)', 'Brown/Millets rice (40g)', 'Ghee (2.5g)', 'Cumin & Asafoetida'], instructions: 'One-pot pressure cook mixed lentils and millets with fragrant whole spices.' },
        postWorkout: { name: 'Soy Milk with Turmeric & Cardamom', cal: 130, p: 12, c: 8, f: 5, fiber: 2, time: '3 min', ingredients: ['Fortified unsweetened Soy milk (250ml)', 'Fresh turmeric & crushed cardamom'], instructions: 'Warm the soy milk and whisk with aromatic anti-inflammatory turmeric.' }
      }
    },
    {
      day: 'Thursday',
      meals: {
        breakfast: { name: 'South Indian Idli (3 pcs) with Sambar & Coconut Dip', cal: 340, p: 13, c: 62, f: 4, fiber: 7, time: '15 min', ingredients: ['Steamed Rice-Urad Idlis (3)', 'Vegetable Lentil Sambar (150ml)', 'Fresh Coconut Chutney (1 tbsp)'], instructions: 'Steam fermented batter. Serve hot with drumstick and tomato lentil sambar.' },
        morningSnack: { name: 'Orange or Seasonal Citrus with Pumpkin Seeds', cal: 110, p: 4, c: 18, f: 4, fiber: 3.5, time: '2 min', ingredients: ['1 Whole Orange', 'Raw Pumpkin seeds (10g)'], instructions: 'Peel and consume whole fruit to retain dietary pectin fiber.' },
        lunch: { name: 'Pindi Chole (Chickpeas) with Steamed Jeera Brown Rice', cal: 520, p: 22, c: 78, f: 12, fiber: 14, time: '30 min', ingredients: ['Boiled Kabuli Chana (80g dry)', 'Brown Rice (100g cooked)', 'Onion-Tomato-Anardana gravy'], instructions: 'Cook chickpeas in dark tea-infused water and simmer in aromatic anardana spices.' },
        eveningSnack: { name: 'Cucumber & Tomato slices with Lemon Hummus', cal: 150, p: 5, c: 18, f: 7, fiber: 4, time: '5 min', ingredients: ['Cucumber & Carrot batons (100g)', 'Chickpea Tahini Hummus (2 tbsp)'], instructions: 'Dip crunchy raw vegetable sticks into garlic-lemon hummus.' },
        dinner: { name: 'Methi (Fenugreek) Paneer Bhurji with 2 Ragi Rotis', cal: 410, p: 24, c: 46, f: 14, fiber: 8, time: '20 min', ingredients: ['Fresh Fenugreek leaves (50g)', 'Cottage Cheese (100g)', 'Finger millet/Ragi rotis (2)'], instructions: 'Sauté slightly bitter methi leaves with paneer crumble to stabilize post-prandial blood sugar.' },
        postWorkout: { name: 'Whey / Plant Isolate with Water', cal: 130, p: 25, c: 3, f: 1.5, fiber: 1, time: '2 min', ingredients: ['Protein Isolate (1 scoop)', 'Chilled water (300ml)'], instructions: 'Fast-digesting post-exercise recovery shake.' }
      }
    },
    {
      day: 'Friday',
      meals: {
        breakfast: { name: 'Sprouted Moong & Poha Medley', cal: 320, p: 14, c: 54, f: 6, fiber: 8, time: '15 min', ingredients: ['Flattened Rice/Poha (40g)', 'Sprouted Moong (50g)', 'Peanuts (10g)', 'Mustard seeds, Curry leaves'], instructions: 'Steam poha and sprouts, temper with fragrant curry leaves and roasted peanuts.' },
        morningSnack: { name: 'Guava with Himalayan Pink Salt & Chili', cal: 80, p: 3, c: 18, f: 1, fiber: 7, time: '3 min', ingredients: ['1 Fresh Pink or White Guava', 'Rock salt & degi mirch'], instructions: 'Super rich in Vitamin C and fiber; dice into bite-size wedges.' },
        lunch: { name: 'Paneer Tikka with Grilled Bell Peppers, Dal & 1 Roti', cal: 500, p: 28, c: 48, f: 19, fiber: 8, time: '25 min', ingredients: ['Marinated Paneer (120g)', 'Thick Curd marinade', 'Moong dal (100ml)', 'Whole wheat roti (1)'], instructions: 'Grill skewers of curd-marinated paneer and capsicum until lightly charred.' },
        eveningSnack: { name: 'Roasted Black Chickpeas (Bhuna Chana)', cal: 130, p: 8, c: 20, f: 2, fiber: 6, time: '1 min', ingredients: ['Skin-on roasted chana (35g)'], instructions: 'Classic slow-digesting protein and low glycemic index snack.' },
        dinner: { name: 'Lauki (Bottle Gourd) Kofta in Light Gravy with Bajra Roti', cal: 380, p: 15, c: 55, f: 10, fiber: 11, time: '30 min', ingredients: ['Grated Lauki + Besan steamed dumplings', 'Pearl Millet / Bajra roti (1.5)', 'Tomato gravy'], instructions: 'Steam bottle gourd dumplings instead of deep frying for a light, easily digestible dinner.' },
        postWorkout: { name: 'Protein Buttermilk (Spiced Chhaas)', cal: 120, p: 16, c: 7, f: 2, fiber: 1, time: '3 min', ingredients: ['Whisked curd (100g) + 1/2 scoop unflavored protein', 'Roasted cumin, Ginger & Mint'], instructions: 'Savory, digestive, and hydrating post-exercise drink.' }
      }
    },
    {
      day: 'Saturday',
      meals: {
        breakfast: { name: 'Avocado & Scrambled Paneer Sourdough Toast', cal: 360, p: 18, c: 38, f: 16, fiber: 7, time: '12 min', ingredients: ['Artisan Sourdough (1 thick slice)', 'Mashed Avocado (30g)', 'Crumbled Paneer (80g)', 'Chili flakes'], instructions: 'Spread mashed avocado over toasted sourdough, top with seasoned warm crumbled paneer.' },
        morningSnack: { name: 'Handful Roasted Sunflower & Chia Seeds', cal: 120, p: 4, c: 4, f: 10, fiber: 3, time: '1 min', ingredients: ['Sunflower seeds (15g)', 'Chia seeds (5g)'], instructions: 'Loaded with magnesium, zinc, and heart-healthy alpha-linolenic fatty acids.' },
        lunch: { name: 'Kadhi Pakora (Air-fried/Steamed) with Basmati Rice & Beetroot Salad', cal: 480, p: 18, c: 72, f: 12, fiber: 7, time: '30 min', ingredients: ['Sour buttermilk kadhi (200ml)', 'Steamed besan dumplings (3)', 'Basmati rice (100g cooked)', 'Grated beetroot (60g)'], instructions: 'Simmer gut-friendly probiotic yogurt kadhi with fenugreek seeds.' },
        eveningSnack: { name: 'Warm Cinnamon Spiced Almond Milk', cal: 90, p: 3, c: 5, f: 6, fiber: 1, time: '5 min', ingredients: ['Unsweetened Almond Milk (200ml)', 'Crushed nutmeg & cinnamon'], instructions: 'Calming, aromatic pre-evening beverage.' },
        dinner: { name: 'Mushroom & Soya Granule Stir Fry with Whole Wheat Wrap', cal: 420, p: 32, c: 44, f: 9, fiber: 10, time: '20 min', ingredients: ['Rehydrated Soya Granules (40g dry)', 'Button Mushrooms (100g)', 'Whole wheat tortilla/roti (1)'], instructions: 'High protein powerhouse: sauté mushrooms and soya with caramelized onions and rolling in a soft roti.' },
        postWorkout: { name: 'Cold Brew Protein Iced Latte', cal: 140, p: 22, c: 4, f: 2, fiber: 1, time: '3 min', ingredients: ['Espresso or cold brew (150ml)', 'Whey or pea vanilla protein (1 scoop)', 'Ice cubes'], instructions: 'Blend cold brew with protein powder and pour over ice for muscle repair.' }
      }
    },
    {
      day: 'Sunday',
      meals: {
        breakfast: { name: 'Healthy Paneer Stuffed Paratha with Fresh Curd', cal: 390, p: 20, c: 48, f: 14, fiber: 6, time: '20 min', ingredients: ['Whole wheat dough (50g)', 'Grated Paneer stuffing with green chilies (80g)', 'Fresh homemade curd (80g)'], instructions: 'Roll paratha with spiced paneer, roast on iron skillet with minimal cold-pressed oil.' },
        morningSnack: { name: 'Slice of Papaya with Lime Squeeze', cal: 70, p: 1, c: 17, f: 0.2, fiber: 3, time: '2 min', ingredients: ['Fresh ripe Papaya cubes (150g)', 'Fresh lime'], instructions: 'Rich in digestive papain enzyme, soothing stomach lining.' },
        lunch: { name: 'Whole Brown Chana Curry with Steamed Rice & Onion Koshimbir', cal: 490, p: 22, c: 74, f: 10, fiber: 14, time: '30 min', ingredients: ['Kala Chana (75g dry)', 'Rice (100g)', 'Onion-tomato-coriander koshimbir'], instructions: 'Cook wholesome rustic brown chickpeas in slow-simmered onion-garlic masala.' },
        eveningSnack: { name: 'Masala Chai (Low-fat milk, jaggery pinch) & Marie / Khari', cal: 110, p: 3, c: 18, f: 2, fiber: 1, time: '8 min', ingredients: ['Ginger cardamom tea with 50ml toned milk', 'Multigrain baked biscuit (1)'], instructions: 'Relaxing afternoon tea pause.' },
        dinner: { name: 'Warm Mediterranean Quinoa Salad with Roasted Chickpeas & Feta/Tofu', cal: 430, p: 21, c: 56, f: 14, fiber: 11, time: '20 min', ingredients: ['Cooked Quinoa (120g)', 'Crispy spiced chickpeas (60g)', 'Diced Bell peppers, Olives, Diced Tofu (60g)'], instructions: 'Toss warm quinoa with seasoned crispy chickpeas, greens, and lemon-oregano vinaigrette.' },
        postWorkout: { name: 'Turmeric Golden Milk with Whey', cal: 160, p: 22, c: 8, f: 4, fiber: 1, time: '5 min', ingredients: ['Warm skimmed milk (200ml)', 'Curcumin extract, Black pepper, 1 scoop vanilla whey'], instructions: 'Promotes deep muscle synthesis and restful sleep.' }
      }
    }
  ],
  non_vegetarian: [
    {
      day: 'Monday',
      meals: {
        breakfast: { name: '3-Egg Omelet (2 Whites, 1 Whole) with Sourdough & Spinach', cal: 340, p: 26, c: 28, f: 12, fiber: 4, time: '10 min', ingredients: ['3 Eggs (2 whites, 1 whole)', 'Baby spinach (50g)', 'Sourdough toast (1 slice)'], instructions: 'Whisk eggs with herbs, fold over sautéed baby spinach and serve with artisan toast.' },
        morningSnack: { name: 'Greek Yogurt with Blueberries', cal: 130, p: 15, c: 14, f: 1, fiber: 2, time: '2 min', ingredients: ['Plain non-fat Greek yogurt (150g)', 'Blueberries (30g)'], instructions: 'High protein gut-friendly snack.' },
        lunch: { name: 'Grilled Herb Chicken Breast with Brown Rice & Steamed Veggies', cal: 520, p: 44, c: 52, f: 12, fiber: 7, time: '25 min', ingredients: ['Chicken Breast (160g)', 'Brown Rice (120g cooked)', 'Broccoli & Carrots (100g)'], instructions: 'Marinate chicken breast with lemon, rosemary, garlic; pan grill until tender.' },
        eveningSnack: { name: 'Roasted Spiced Chickpeas', cal: 140, p: 7, c: 22, f: 3, fiber: 5, time: '5 min', ingredients: ['Chickpeas (40g dry roasted)', 'Paprika, Sea salt'], instructions: 'Crunchy savory afternoon fuel.' },
        dinner: { name: 'Pan-Seared Salmon or Rohu Fish with Quinoa & Asparagus', cal: 460, p: 38, c: 38, f: 16, fiber: 6, time: '20 min', ingredients: ['Salmon or Indian freshwater fish (150g)', 'Quinoa (100g cooked)', 'Asparagus / Green beans (80g)'], instructions: 'Rich in natural Omega-3s. Sear skin-side down until crispy.' },
        postWorkout: { name: 'Whey Protein Isolate with Water', cal: 120, p: 25, c: 2, f: 1, fiber: 0, time: '2 min', ingredients: ['Whey Isolate (1 scoop)', 'Water (300ml)'], instructions: 'Rapid muscle recovery blend.' }
      }
    }
  ]
};

const WORKOUT_PROGRAMS = {
  home: [
    {
      day: 'Day 1: Full Body Strength & Core',
      duration: '40 min',
      difficulty: 'Beginner to Intermediate',
      warmup: '5 mins arm circles, cat-cow, leg swings, jumping jacks',
      exercises: [
        { name: 'Bodyweight Squats', sets: '3 sets', reps: '12-15 reps', rest: '60s', muscle: 'Quadriceps, Glutes', notes: 'Keep chest upright, drive through heels.' },
        { name: 'Push-Ups (or Incline on counter)', sets: '3 sets', reps: '8-12 reps', rest: '60s', muscle: 'Chest, Shoulders, Triceps', notes: 'Maintain tight hollow body plank line.' },
        { name: 'Glute Bridges', sets: '3 sets', reps: '15 reps', rest: '45s', muscle: 'Glutes, Hamstrings', notes: 'Pause and squeeze glutes for 2s at the top.' },
        { name: 'Resistance Band Rows (or Door-Anchor)', sets: '3 sets', reps: '12-15 reps', rest: '60s', muscle: 'Upper Back, Lats, Biceps', notes: 'Retract shoulder blades fully.' },
        { name: 'Plank Hold', sets: '3 sets', reps: '30-45 sec', rest: '45s', muscle: 'Core, Transverse Abdominis', notes: 'Do not allow lower back to sag.' }
      ],
      cooldown: 'Child’s pose, hamstring stretch, cobra stretch for 5 mins'
    },
    {
      day: 'Day 2: Cardio Conditioning & Mobility',
      duration: '35 min',
      difficulty: 'All Levels',
      warmup: '3 mins gentle marching, hip openers, torso twists',
      exercises: [
        { name: 'Brisk Walk or Jogging Intervals', sets: '1 continuous', reps: '20 mins', rest: 'N/A', muscle: 'Cardiovascular, Calves', notes: 'Zone 2 aerobic conditioning.' },
        { name: 'Reverse Lunges', sets: '3 sets', reps: '10 reps/leg', rest: '45s', muscle: 'Quads, Balance, Glutes', notes: 'Step back gently, knee hovering 1 inch off floor.' },
        { name: 'Mountain Climbers', sets: '3 sets', reps: '30 sec', rest: '45s', muscle: 'Shoulder stability, Core, Cardio', notes: 'Keep hips low and controlled rhythm.' },
        { name: 'Bird-Dog', sets: '3 sets', reps: '10 reps/side', rest: '30s', muscle: 'Posterior chain, Deep core', notes: 'Extend opposite arm and leg without arching spine.' }
      ],
      cooldown: 'Deep breathing, seated forward fold, quad stretch'
    },
    {
      day: 'Day 3: Upper Body Tone & Posture',
      duration: '40 min',
      difficulty: 'Intermediate',
      warmup: 'Shoulder rolls, band pull-aparts, thoracic rotations',
      exercises: [
        { name: 'Dumbbell or Band Overhead Press', sets: '3 sets', reps: '10-12 reps', rest: '60s', muscle: 'Deltoids, Upper Chest', notes: 'Brace core, do not arch lower back.' },
        { name: 'Dumbbell / Backpack Romanian Deadlift', sets: '3 sets', reps: '12 reps', rest: '60s', muscle: 'Hamstrings, Glutes, Lower back', notes: 'Hinge back at the hips, keeping shins vertical.' },
        { name: 'Chair / Bench Tricep Dips', sets: '3 sets', reps: '10-12 reps', rest: '60s', muscle: 'Triceps, Anterior Deltoid', notes: 'Keep back close to the bench.' },
        { name: 'Band Bicep Curls', sets: '3 sets', reps: '15 reps', rest: '45s', muscle: 'Biceps, Forearms', notes: 'Squeeze peak contraction at the top.' },
        { name: 'Dead Bug', sets: '3 sets', reps: '12 reps/side', rest: '45s', muscle: 'Deep Core Stabilization', notes: 'Press lumbar spine firmly into the floor.' }
      ],
      cooldown: 'Chest doorway stretch, tricep stretch, child pose'
    }
  ],
  gym: [
    {
      day: 'Day 1: Push Focus (Chest, Shoulders, Triceps)',
      duration: '50 min',
      difficulty: 'Intermediate',
      warmup: 'Treadmill incline walk 5 mins, shoulder dislocates, light rotator cuff band work',
      exercises: [
        { name: 'Barbell or Dumbbell Bench Press', sets: '3 sets', reps: '8-10 reps', rest: '90s', muscle: 'Pectoralis Major, Triceps', notes: 'Control eccentric descent to mid-chest.' },
        { name: 'Seated Dumbbell Shoulder Press', sets: '3 sets', reps: '10-12 reps', rest: '75s', muscle: 'Anterior & Lateral Deltoids', notes: 'Elbows slightly tucked at 45 degrees.' },
        { name: 'Incline Dumbbell Flyes or Cable Crossover', sets: '3 sets', reps: '12-15 reps', rest: '60s', muscle: 'Clavicular Chest', notes: 'Feel deep chest stretch without overstretching.' },
        { name: 'Cable Tricep Rope Pushdowns', sets: '3 sets', reps: '12-15 reps', rest: '60s', muscle: 'Lateral & Medial Triceps', notes: 'Flay rope apart at bottom for peak contraction.' },
        { name: 'Hanging Leg or Knee Raises', sets: '3 sets', reps: '12 reps', rest: '60s', muscle: 'Lower Rectus Abdominis', notes: 'Avoid swinging momentum; curl pelvis up.' }
      ],
      cooldown: 'Doorway chest stretch, overhead tricep stretch 5 mins'
    },
    {
      day: 'Day 2: Pull Focus (Back, Biceps, Rear Delts)',
      duration: '50 min',
      difficulty: 'Intermediate',
      warmup: 'Rowing machine 5 mins, lat stretches, scapular pull-ups',
      exercises: [
        { name: 'Lat Pulldown (or Assisted Pull-Ups)', sets: '4 sets', reps: '10-12 reps', rest: '75s', muscle: 'Latissimus Dorsi, Teres Major', notes: 'Pull elbows toward back pockets.' },
        { name: 'Seated Cable Row or Chest-Supported Row', sets: '3 sets', reps: '10-12 reps', rest: '75s', muscle: 'Rhomboids, Mid-Traps', notes: 'Squeeze shoulder blades together.' },
        { name: 'Face Pulls with Cable Rope', sets: '3 sets', reps: '15-18 reps', rest: '60s', muscle: 'Rear Delts, External Rotators', notes: 'Essential for posture and shoulder health.' },
        { name: 'Incline Dumbbell Bicep Curls', sets: '3 sets', reps: '12 reps', rest: '60s', muscle: 'Biceps Brachii Long Head', notes: 'Maximize stretch at bottom.' },
        { name: 'Hyperextensions (Back Extensions)', sets: '3 sets', reps: '12-15 reps', rest: '60s', muscle: 'Erector Spinae, Glutes', notes: 'Neutral neck and spine throughout.' }
      ],
      cooldown: 'Lat hanging stretch, bicep stretch, foam roll upper back'
    },
    {
      day: 'Day 3: Lower Body & Core Power',
      duration: '55 min',
      difficulty: 'Intermediate to Advanced',
      warmup: 'Stationary bike 5 mins, deep bodyweight squats, hip 90/90 mobility',
      exercises: [
        { name: 'Barbell Back Squats or Goblet Squats', sets: '4 sets', reps: '8-10 reps', rest: '90s', muscle: 'Quads, Adductors, Glutes', notes: 'Knees track over second toe.' },
        { name: 'Romanian Deadlifts (RDL)', sets: '3 sets', reps: '10-12 reps', rest: '90s', muscle: 'Hamstrings, Gluteus Maximus', notes: 'Push hips backward until deep hamstring stretch.' },
        { name: 'Leg Press Machine', sets: '3 sets', reps: '12-15 reps', rest: '75s', muscle: 'Quadriceps, Glutes', notes: 'Avoid locking knees aggressively at the top.' },
        { name: 'Seated or Standing Calf Raises', sets: '3 sets', reps: '15-20 reps', rest: '45s', muscle: 'Gastrocnemius, Soleus', notes: 'Pause 2s in full stretch, 1s at top.' },
        { name: 'Cable Woodchoppers', sets: '3 sets', reps: '12 reps/side', rest: '45s', muscle: 'Obliques, Rotational Core', notes: 'Initiate twist through core, not arms.' }
      ],
      cooldown: 'Hamstring stretch, pigeon stretch for glutes, foam rolling quads'
    }
  ]
};

// Mifflin-St Jeor Formula
function calculateBMR(weightKg, heightCm, age, sex) {
  if (sex === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

function calculateTDEE(bmr, activityLevel) {
  const factor = ACTIVITY_FACTORS[activityLevel]?.factor || 1.375;
  return Math.round(bmr * factor);
}

// Healthy BMI weight range: 18.5 to 24.9
function getHealthyWeightRange(heightCm) {
  const heightM = heightCm / 100;
  const minWeight = Math.round(18.5 * (heightM * heightM) * 10) / 10;
  const maxWeight = Math.round(24.9 * (heightM * heightM) * 10) / 10;
  return { min: minWeight, max: maxWeight };
}

function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = 'Normal weight';
  let badgeColor = 'text-emerald-500 bg-emerald-50 border-emerald-200';

  if (bmi < 18.5) {
    category = 'Underweight';
    badgeColor = 'text-amber-500 bg-amber-50 border-amber-200';
  } else if (bmi < 25) {
    category = 'Normal weight';
    badgeColor = 'text-emerald-500 bg-emerald-50 border-emerald-200';
  } else if (bmi < 30) {
    category = 'Overweight';
    badgeColor = 'text-orange-500 bg-orange-50 border-orange-200';
  } else {
    category = 'Obese';
    badgeColor = 'text-rose-500 bg-rose-50 border-rose-200';
  }

  return {
    value: Math.round(bmi * 10) / 10,
    category,
    badgeColor
  };
}

// Calculate target calories with health safety boundaries
function calculateGoalCalories(tdee, goal, sex) {
  let target = tdee;
  let weeklyPaceKg = 0;
  let deficitOrSurplus = 0;
  let warning = null;

  if (goal === 'lose_weight') {
    // Standard sustainable deficit of ~450 kcal/day (~0.45 kg/week)
    deficitOrSurplus = -450;
    target = tdee + deficitOrSurplus;
    weeklyPaceKg = -0.45;

    // Safety checks: minimum safe intake (1200 for women, 1500 for men)
    const minSafe = sex === 'male' ? 1500 : 1200;
    if (target < minSafe) {
      warning = `Calorie deficit was adjusted to safe clinical minimum of ${minSafe} kcal to protect thyroid, metabolic rate and nutritional adequacy.`;
      target = minSafe;
      deficitOrSurplus = target - tdee;
      weeklyPaceKg = Math.round((deficitOrSurplus * 7 / 7700) * 100) / 100;
    }
  } else if (goal === 'gain_muscle') {
    // Lean surplus of ~350 kcal/day to minimize unwanted fat gain
    deficitOrSurplus = 350;
    target = tdee + deficitOrSurplus;
    weeklyPaceKg = 0.3;
  } else {
    // Maintenance
    deficitOrSurplus = 0;
    target = tdee;
    weeklyPaceKg = 0;
  }

  return {
    targetCalories: Math.round(target),
    deficitOrSurplus,
    weeklyPaceKg,
    warning
  };
}

// Evidence-based macronutrient distribution
function calculateMacros(totalCalories, weightKg, goal) {
  // Protein: 1.8g to 2.2g per kg bodyweight for weight loss/muscle retention
  let proteinGrams = Math.round(weightKg * 1.8);
  if (goal === 'gain_muscle') proteinGrams = Math.round(weightKg * 2.0);
  if (goal === 'maintain') proteinGrams = Math.round(weightKg * 1.6);

  const proteinCals = proteinGrams * 4;

  // Fat: 25% of total calories
  const fatCals = totalCalories * 0.25;
  const fatGrams = Math.round(fatCals / 9);

  // Carbs: remaining calories
  const carbCals = Math.max(0, totalCalories - (proteinCals + fatCals));
  const carbGrams = Math.round(carbCals / 4);

  // Fiber target: 14g per 1000 kcal
  const fiberGrams = Math.round((totalCalories / 1000) * 14);

  return {
    protein: { grams: proteinGrams, cal: proteinCals, pct: Math.round((proteinCals / totalCalories) * 100) },
    fat: { grams: fatGrams, cal: Math.round(fatCals), pct: 25 },
    carbs: { grams: carbGrams, cal: Math.round(carbCals), pct: Math.round((carbCals / totalCalories) * 100) },
    fiberGrams
  };
}

// Hydration estimate (35ml/kg + 500ml activity allowance)
function calculateHydration(weightKg, workoutDays) {
  const baseMl = weightKg * 35;
  const activityExtra = (workoutDays / 7) * 500;
  const totalMl = Math.round(baseMl + activityExtra);
  return {
    totalMl,
    liters: (totalMl / 1000).toFixed(1),
    glasses: Math.round(totalMl / 250)
  };
}

// Estimated dynamic timeline with diminishing returns
function calculateTimeline(currentKg, targetKg, weeklyPaceKg) {
  const diffKg = Math.abs(currentKg - targetKg);
  if (diffKg === 0 || weeklyPaceKg === 0) {
    return { weeks: 0, targetDate: 'Goal reached', estimatedEndDate: new Date() };
  }
  // Realistic pacing: account for metabolic adaptation (takes ~15% longer than flat arithmetic)
  const realisticPace = Math.abs(weeklyPaceKg) * 0.88;
  const estimatedWeeks = Math.ceil(diffKg / realisticPace);

  const now = new Date();
  const targetDateObj = new Date(now.getTime() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000);
  const formattedDate = targetDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    diffKg: Math.round(diffKg * 10) / 10,
    weeks: estimatedWeeks,
    targetDate: formattedDate,
    estimatedEndDate: targetDateObj
  };
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showLogWeightModal, setShowLogWeightModal] = useState(false);
  const [showMealDetailsModal, setShowMealDetailsModal] = useState(null);

  // Daily tracker state
  const [todayWaterLoggedMl, setTodayWaterLoggedMl] = useState(1750);
  const [completedWorkouts, setCompletedWorkouts] = useState(['Day 1']);
  const [selectedWorkoutMode, setSelectedWorkoutMode] = useState('home');
  const [selectedDietDayIndex, setSelectedDietDayIndex] = useState(0);

  // Weight history log
  const [weightLogs, setWeightLogs] = useState([
    { date: '2026-09-01', weight: 81.2 },
    { date: '2026-09-08', weight: 80.5 },
    { date: '2026-09-15', weight: 79.8 },
    { date: '2026-09-22', weight: 79.1 },
    { date: '2026-09-29', weight: 78.4 },
    { date: '2026-10-06', weight: 78.0 }
  ]);
  const [newWeightInput, setNewWeightInput] = useState('');

  // AI Chat Assistant state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${DEFAULT_PROFILE.name}! I'm FitLife AI, your personal health and nutrition companion. Based on your goal of sustainable weight management and vegetarian preference, how can I assist you with your diet, recipes, or training today?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const calculations = useMemo(() => {
    const bmr = calculateBMR(profile.currentWeightKg, profile.heightCm, profile.age, profile.sex);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const bmiData = calculateBMI(profile.currentWeightKg, profile.heightCm);
    const healthyRange = getHealthyWeightRange(profile.heightCm);
    const goalCalData = calculateGoalCalories(tdee, profile.primaryGoal, profile.sex);
    const macros = calculateMacros(goalCalData.targetCalories, profile.currentWeightKg, profile.primaryGoal);
    const hydration = calculateHydration(profile.currentWeightKg, profile.workoutDaysPerWeek);
    const timeline = calculateTimeline(profile.currentWeightKg, profile.targetWeightKg, goalCalData.weeklyPaceKg);

    const initialWeight = weightLogs[0]?.weight || profile.currentWeightKg;
    const totalGoalLoss = initialWeight - profile.targetWeightKg;
    const currentProgressKg = initialWeight - profile.currentWeightKg;
    const progressPercent = totalGoalLoss > 0
      ? Math.min(100, Math.max(0, Math.round((currentProgressKg / totalGoalLoss) * 100)))
      : 100;

    return {
      bmr,
      tdee,
      bmiData,
      healthyRange,
      goalCalData,
      macros,
      hydration,
      timeline,
      progressPercent
    };
  }, [profile, weightLogs]);

  // Scroll AI chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSendChatMessage = async (presetText) => {
    const query = presetText || chatInput.trim();
    if (!query) return;

    const userMessage = { sender: 'user', text: query };
    setChatMessages((prev) => [...prev, userMessage]);
    if (!presetText) setChatInput('');
    setIsChatLoading(true);

    try {
      const systemInstruction = `You are FitLife AI, an empathetic, certified, evidence-based sports nutritionist and health coach.
User Context:
- Name: ${profile.name}
- Age: ${profile.age}, Sex: ${profile.sex}
- Height: ${profile.heightCm} cm, Current Weight: ${profile.currentWeightKg} kg, Target: ${profile.targetWeightKg} kg
- Diet: ${profile.dietaryPreference}, Cuisines: ${profile.preferredCuisines.join(', ')}
- Goal: ${profile.primaryGoal}, Activity: ${profile.activityLevel}
- Target Calories: ${calculations.goalCalData.targetCalories} kcal (Protein: ${calculations.macros.protein.grams}g, Carbs: ${calculations.macros.carbs.grams}g, Fat: ${calculations.macros.fat.grams}g)
- Allergies: ${profile.allergies.join(', ') || 'None'}

Rules:
1. Always offer compassionate, science-backed guidance prioritizing long-term adherence and a positive relationship with food.
2. Support regional foods (like Dal, Roti, Paneer, Chana, Idli, Quinoa, Oats).
3. If asked for a meal substitution, match the macronutrients closely.
4. Maintain a clear wellness disclaimer: clarify this is educational fitness guidance, not clinical medical advice. Never prescribe extreme caloric deficit (<1200 kcal) or diagnose medical conditions.
5. Keep responses concise, well-structured, formatted with neat bullet points.`;

      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [{ text: query }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      } else {
        throw new Error('Empty response from model');
      }
    } catch (err) {
      // Fallback response with reliable domain logic
      const fallbackReplies = {
        sub: `For ${profile.dietaryPreference} meal substitutions, you can swap 100g of Paneer (approx 18g Protein, 20g Fat) with 150g of Firm Tofu (18g Protein, 8g Fat + add 1 tsp olive oil or 6-8 crushed almonds to match healthy fats).`,
        plateau: `Weight fluctuations are normal and often caused by water retention, cortisol, or glycogen shifts. Continue tracking your weekly rolling averages rather than daily peaks, and consider taking a 2-day diet break at maintenance (${calculations.tdee} kcal).`,
        default: `As your FitLife AI coach, remember that sustainable progress is built on consistency rather than perfection. Your target of ${calculations.goalCalData.targetCalories} kcal provides an optimal, healthy balance for your body without metabolic slowdown. Feel free to ask about recipe swaps, workout form, or hydration!`
      };

      let fallbackText = fallbackReplies.default;
      if (query.toLowerCase().includes('substitute') || query.toLowerCase().includes('swap')) {
        fallbackText = fallbackReplies.sub;
      } else if (query.toLowerCase().includes('stuck') || query.toLowerCase().includes('plateau')) {
        fallbackText = fallbackReplies.plateau;
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: fallbackText }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAddWeightLog = (e) => {
    e.preventDefault();
    const parsed = parseFloat(newWeightInput);
    if (!parsed || parsed < 30 || parsed > 300) {
      showToast('Please enter a valid weight between 30kg and 300kg.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedLogs = [...weightLogs, { date: todayStr, weight: parsed }];
    setWeightLogs(updatedLogs);
    setProfile((prev) => ({ ...prev, currentWeightKg: parsed }));
    setNewWeightInput('');
    setShowLogWeightModal(false);
    showToast(`Logged weight ${parsed} kg. Targets updated dynamically!`);
  };

  const handleWaterAdd = (amount) => {
    const updated = Math.max(0, todayWaterLoggedMl + amount);
    setTodayWaterLoggedMl(updated);
    if (amount > 0) {
      showToast(`+${amount}ml logged! Current: ${(updated / 1000).toFixed(2)}L`);
    }
  };

  // Grocery list compiled from diet plan
  const compiledGroceryList = useMemo(() => {
    return [
      { category: 'Lentils & Legumes', items: ['Yellow Moong Dal (500g)', 'Toor Dal (500g)', 'Kala Chana / Chickpeas (500g)', 'Rajma / Kidney Beans (500g)'] },
      { category: 'Dairy & Plant Proteins', items: ['Low-fat Paneer (500g)', 'Firm Tofu (400g)', 'Greek Yogurt / Curd (1kg)', 'Plant or Whey Protein (1 tub)'] },
      { category: 'Grains & Millets', items: ['Multigrain Atta (2kg)', 'Rolled Oats (1kg)', 'Brown Rice / Quinoa (1kg)', 'Jowar / Ragi Flour (500g)'] },
      { category: 'Fresh Produce', items: ['Baby Spinach & Palak (500g)', 'Broccoli & Zucchini (500g)', 'Cucumbers & Tomatoes (1kg)', 'Seasonal Apples & Papaya (1kg)'] },
      { category: 'Healthy Fats & Nuts', items: ['Raw Almonds & Walnuts (250g)', 'Flaxseeds & Chia Seeds (200g)', 'Cold Pressed Mustard/Olive Oil (500ml)'] }
    ];
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                FitLife AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Smart Health Companion
              </span>
            </div>
          </div>

          {/* Quick Profile Overview Badge */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLogWeightModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 text-slate-200 transition-all hover:border-emerald-500/50"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log Weight ({profile.currentWeightKg} kg)</span>
            </button>

            <button
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800 hover:from-slate-700 hover:to-slate-700 border border-slate-700 transition"
              title="Edit Profile"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {profile.name[0]}
              </div>
              <span className="text-xs font-medium hidden md:inline text-slate-300">
                {profile.name}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar space-x-1 sm:space-x-2 py-2 border-t border-slate-800/60 text-xs sm:text-sm font-medium">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'diet', label: '7-Day Diet', icon: Utensils },
            { id: 'workouts', label: 'Workouts', icon: Dumbbell },
            { id: 'water', label: 'Hydration', icon: Droplets },
            { id: 'calculator', label: 'Weight & Energy', icon: Flame },
            { id: 'coach', label: 'AI Health Coach', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Render Active View Tab */}
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            calculations={calculations}
            todayWaterLoggedMl={todayWaterLoggedMl}
            handleWaterAdd={handleWaterAdd}
            weightLogs={weightLogs}
            setActiveTab={setActiveTab}
            completedWorkouts={completedWorkouts}
            onOpenLogModal={() => setShowLogWeightModal(true)}
          />
        )}

        {activeTab === 'diet' && (
          <DietPlanView
            profile={profile}
            calculations={calculations}
            selectedDietDayIndex={selectedDietDayIndex}
            setSelectedDietDayIndex={setSelectedDietDayIndex}
            onOpenMealDetails={(meal) => setShowMealDetailsModal(meal)}
            compiledGroceryList={compiledGroceryList}
            showToast={showToast}
            onAskAiSubstitution={(item) => {
              setActiveTab('coach');
              handleSendChatMessage(`What is a nutritious, healthy substitution for "${item}" that keeps my protein and calorie balance steady?`);
            }}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            profile={profile}
            selectedWorkoutMode={selectedWorkoutMode}
            setSelectedWorkoutMode={setSelectedWorkoutMode}
            completedWorkouts={completedWorkouts}
            setCompletedWorkouts={setCompletedWorkouts}
            showToast={showToast}
          />
        )}

        {activeTab === 'water' && (
          <HydrationView
            calculations={calculations}
            todayWaterLoggedMl={todayWaterLoggedMl}
            handleWaterAdd={handleWaterAdd}
            showToast={showToast}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorsView
            profile={profile}
            setProfile={setProfile}
            calculations={calculations}
            showToast={showToast}
          />
        )}

        {activeTab === 'coach' && (
          <AiCoachView
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChatMessage={handleSendChatMessage}
            isChatLoading={isChatLoading}
            chatBottomRef={chatBottomRef}
            profile={profile}
          />
        )}
      </main>

      {/* Footer & Medical Disclaimers */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p>
              <strong className="text-slate-200">Responsible Health Disclaimer:</strong> FitLife AI is an educational wellness and lifestyle companion. It does not replace individualized clinical advice, diagnosis, or prescription from a medical doctor or registered clinical dietitian.
            </p>
          </div>
          <div className="text-slate-500 whitespace-nowrap">
            Designed for sustainable progress & metabolic longevity.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {showLogWeightModal && (
        <LogWeightModal
          currentWeight={profile.currentWeightKg}
          newWeightInput={newWeightInput}
          setNewWeightInput={setNewWeightInput}
          onClose={() => setShowLogWeightModal(false)}
          onSubmit={handleAddWeightLog}
        />
      )}

      {showOnboardingModal && (
        <ProfileModal
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowOnboardingModal(false)}
          showToast={showToast}
        />
      )}

      {showMealDetailsModal && (
        <MealDetailsModal
          meal={showMealDetailsModal}
          onClose={() => setShowMealDetailsModal(null)}
          onAskAi={(mealName) => {
            setShowMealDetailsModal(null);
            setActiveTab('coach');
            handleSendChatMessage(`How do I prepare "${mealName}" with maximum nutrient retention and balanced seasoning?`);
          }}
        />
      )}
    </div>
  );
}

function DashboardView({
  profile,
  calculations,
  todayWaterLoggedMl,
  handleWaterAdd,
  weightLogs,
  setActiveTab,
  completedWorkouts,
  onOpenLogModal
}) {
  const { bmiData, healthyRange, goalCalData, macros, hydration, timeline, progressPercent } = calculations;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 p-6 sm:p-8 border border-emerald-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Wellness Plan Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Good day, {profile.name}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Targeting sustainable {profile.primaryGoal === 'lose_weight' ? 'weight loss' : profile.primaryGoal === 'gain_muscle' ? 'muscle hypertrophy' : 'energy maintenance'} with {profile.dietaryPreference} nutrition and {profile.workoutDaysPerWeek} training days per week.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('diet')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2"
            >
              <Utensils className="w-4 h-4" />
              <span>View Today’s Meals</span>
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ask AI Coach</span>
            </button>
          </div>
        </div>

        {/* Metabolic Alert if adjusted */}
        {goalCalData.warning && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{goalCalData.warning}</span>
          </div>
        )}
      </div>

      {/* 4 Essential Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Calorie Target */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Daily Calorie Target</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {goalCalData.targetCalories.toLocaleString()} <span className="text-sm font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>Maintenance: {calculations.tdee} kcal</span>
              <span className="text-emerald-400 font-medium">
                ({goalCalData.deficitOrSurplus > 0 ? `+${goalCalData.deficitOrSurplus}` : goalCalData.deficitOrSurplus} kcal)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>BMR: {calculations.bmr} kcal</span>
            <span>Mifflin-St Jeor</span>
          </div>
        </div>

        {/* Card 2: Current Weight & BMI */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Weight & BMI Status</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{profile.currentWeightKg}</span>
              <span className="text-sm font-normal text-slate-400">kg</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bmiData.badgeColor}`}>
                BMI {bmiData.value} ({bmiData.category})
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Healthy band: <span className="text-slate-200">{healthyRange.min} – {healthyRange.max} kg</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] flex justify-between">
            <span className="text-slate-400">Target: {profile.targetWeightKg} kg</span>
            <button onClick={onOpenLogModal} className="text-emerald-400 hover:underline font-medium">
              Update Log
            </button>
          </div>
        </div>

        {/* Card 3: Water Hydration Tracker */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Hydration</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{(todayWaterLoggedMl / 1000).toFixed(2)}</span>
              <span className="text-sm font-normal text-slate-400">/ {hydration.liters} L</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((todayWaterLoggedMl / hydration.totalMl) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {Math.round((todayWaterLoggedMl / hydration.totalMl) * 100)}% reached
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleWaterAdd(250)}
                className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-semibold border border-cyan-800"
              >
                +250ml
              </button>
              <button
                onClick={() => handleWaterAdd(500)}
                className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-semibold border border-cyan-800"
              >
                +500ml
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Goal Timeline & Pace */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Projected Milestone</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-white">
              {timeline.targetDate}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ~{timeline.weeks} weeks at sustainable pace ({goalCalData.weeklyPaceKg > 0 ? `+${goalCalData.weeklyPaceKg}` : goalCalData.weeklyPaceKg} kg/wk)
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
            <span>Overall Progress:</span>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Macronutrients breakdown + Weight Progression Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macronutrient Target Bar */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Target Macro Split</h2>
              <p className="text-xs text-slate-400">Tailored to {profile.dietaryPreference} intake</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              {goalCalData.targetCalories} kcal
            </span>
          </div>

          {/* Macro Progress Stack */}
          <div className="space-y-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Protein ({macros.protein.pct}%)</span>
                </span>
                <span className="text-white font-bold">{macros.protein.grams}g <span className="text-slate-400 font-normal">({macros.protein.cal} kcal)</span></span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${macros.protein.pct}%` }} />
              </div>
            </div>

            {/* Carbohydrates */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Complex Carbs ({macros.carbs.pct}%)</span>
                </span>
                <span className="text-white font-bold">{macros.carbs.grams}g <span className="text-slate-400 font-normal">({macros.carbs.cal} kcal)</span></span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${macros.carbs.pct}%` }} />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  <span>Healthy Fats ({macros.fat.pct}%)</span>
                </span>
                <span className="text-white font-bold">{macros.fat.grams}g <span className="text-slate-400 font-normal">({macros.fat.cal} kcal)</span></span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: `${macros.fat.pct}%` }} />
              </div>
            </div>

            {/* Dietary Fiber */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Recommended Daily Fiber</span>
              <span className="text-emerald-400 font-semibold">{macros.fiberGrams}g+ / day</span>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
            <span className="font-semibold text-white">Nutrition Principle:</span> 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal. Preserves lean mass during metabolic conditioning.
          </div>
        </div>

        {/* Weight Trend Chart Card */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Weight Journey Trend</h2>
              <p className="text-xs text-slate-400">Recorded weekly check-ins vs target</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="inline-flex items-center space-x-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Actual Log</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Target: {profile.targetWeightKg}kg</span>
              </span>
            </div>
          </div>

          {/* Clean Visual Trend Representation */}
          <div className="py-4">
            <div className="h-44 flex items-end space-x-3 sm:space-x-6 border-b border-slate-800 px-2">
              {weightLogs.map((log, idx) => {
                const minWeightRef = Math.min(...weightLogs.map((l) => l.weight), profile.targetWeightKg) - 1;
                const maxWeightRef = Math.max(...weightLogs.map((l) => l.weight)) + 1;
                const range = maxWeightRef - minWeightRef || 1;
                const heightPct = Math.max(15, Math.min(100, Math.round(((log.weight - minWeightRef) / range) * 100)));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
                      {log.weight} kg on {log.date}
                    </div>

                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-md"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 mt-2 rotate-[-25deg] sm:rotate-0 origin-left">
                      {log.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800 gap-2">
            <div>
              Initial: <strong className="text-white">{weightLogs[0]?.weight} kg</strong> &bull; Total Shift: <strong className="text-emerald-400 font-bold">{(profile.currentWeightKg - weightLogs[0]?.weight).toFixed(1)} kg</strong>
            </div>
            <button
              onClick={onOpenLogModal}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Check-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Navigation to Workouts & Diet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workout Routine Sneak Peek */}
        <div
          onClick={() => setActiveTab('workouts')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                  {profile.workoutPreference === 'home' ? 'Home Functional Routine' : 'Gym Split Training'}
                </h3>
                <p className="text-xs text-slate-400">
                  {completedWorkouts.length} of {profile.workoutDaysPerWeek} sessions logged this week
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
        </div>

        {/* Weekly Diet Plan Sneak Peek */}
        <div
          onClick={() => setActiveTab('diet')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                  Personalized 7-Day Meal Plan
                </h3>
                <p className="text-xs text-slate-400">
                  {profile.dietaryPreference.toUpperCase()} &bull; Regional Ingredients & Recipes
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DietPlanView({
  profile,
  calculations,
  selectedDietDayIndex,
  setSelectedDietDayIndex,
  onOpenMealDetails,
  compiledGroceryList,
  showToast,
  onAskAiSubstitution
}) {
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Current day's meal plan (cycling through available menu library)
  const activePlanList = REGIONAL_MEALS[profile.dietaryPreference] || REGIONAL_MEALS.vegetarian;
  const currentDayPlan = activePlanList[selectedDietDayIndex % activePlanList.length];

  const mealSlots = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅', meal: currentDayPlan.meals.breakfast },
    { key: 'morningSnack', label: 'Mid-Morning Snack', icon: '🍏', meal: currentDayPlan.meals.morningSnack },
    { key: 'lunch', label: 'Lunch', icon: '🥗', meal: currentDayPlan.meals.lunch },
    { key: 'eveningSnack', label: 'Evening Energy Snack', icon: '🍵', meal: currentDayPlan.meals.eveningSnack },
    { key: 'dinner', label: 'Dinner', icon: '🍲', meal: currentDayPlan.meals.dinner },
    { key: 'postWorkout', label: 'Post-Workout Fuel', icon: '⚡', meal: currentDayPlan.meals.postWorkout }
  ];

  const totalDayCalories = mealSlots.reduce((acc, slot) => acc + (slot.meal?.cal || 0), 0);
  const totalDayProtein = mealSlots.reduce((acc, slot) => acc + (slot.meal?.p || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Day Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <span>Weekly Personalized Meal Plan</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {profile.dietaryPreference}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered around your daily {calculations.goalCalData.targetCalories} kcal budget with regional, affordable ingredients.
          </p>
        </div>

        <button
          onClick={() => setShowGroceryModal(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Consolidated Grocery List</span>
        </button>
      </div>

      {/* Day Selector Pills */}
      <div className="flex overflow-x-auto no-scrollbar space-x-2 py-1">
        {days.map((dayName, idx) => (
          <button
            key={dayName}
            onClick={() => setSelectedDietDayIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              selectedDietDayIndex === idx
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {dayName}
          </button>
        ))}
      </div>

      {/* Daily Nutritional Summary Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-slate-400">Day Total Energy:</span>
            <span className="ml-1.5 font-bold text-white text-sm">{totalDayCalories} kcal</span>
            <span className="text-slate-500 ml-1">/ target {calculations.goalCalData.targetCalories}</span>
          </div>
          <div>
            <span className="text-slate-400">Total Protein:</span>
            <span className="ml-1.5 font-bold text-emerald-400 text-sm">{totalDayProtein}g</span>
            <span className="text-slate-500 ml-1">/ target {calculations.macros.protein.grams}g</span>
          </div>
        </div>

        <div className="text-slate-400 flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>All foods marked with exact portion quantities. Click any meal for cooking instructions.</span>
        </div>
      </div>

      {/* Meal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealSlots.map((slot) => {
          const { meal } = slot;
          if (!meal) return null;

          return (
            <div
              key={slot.key}
              className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center space-x-1.5">
                    <span>{slot.icon}</span>
                    <span>{slot.label}</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {meal.cal} kcal
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {meal.name}
                </h3>

                {/* Macro breakdown pills */}
                <div className="flex items-center space-x-2 mt-3 text-[11px] font-medium text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    P: {meal.p}g
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    C: {meal.c}g
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    F: {meal.f}g
                  </span>
                  {meal.fiber && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Fib: {meal.fiber}g
                    </span>
                  )}
                </div>

                {/* Sample Key Ingredients Preview */}
                <div className="mt-3 text-xs text-slate-400 line-clamp-2">
                  <span className="text-slate-300 font-medium">Ingredients: </span>
                  {meal.ingredients.join(', ')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenMealDetails(meal)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Recipe & Method</span>
                </button>

                <button
                  onClick={() => onAskAiSubstitution(meal.name)}
                  className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                  title="Ask AI for an equal-macro substitute"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Swap</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grocery Modal */}
      {showGroceryModal && (
        <GroceryModal
          groceryList={compiledGroceryList}
          onClose={() => setShowGroceryModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function WorkoutsView({
  profile,
  selectedWorkoutMode,
  setSelectedWorkoutMode,
  completedWorkouts,
  setCompletedWorkouts,
  showToast
}) {
  const currentRoutines = WORKOUT_PROGRAMS[selectedWorkoutMode];

  const toggleWorkoutCompleted = (dayTitle) => {
    if (completedWorkouts.includes(dayTitle)) {
      setCompletedWorkouts(completedWorkouts.filter((d) => d !== dayTitle));
      showToast(`Marked ${dayTitle} as pending.`);
    } else {
      setCompletedWorkouts([...completedWorkouts, dayTitle]);
      showToast(`Awesome work! ${dayTitle} completed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <span>Personalized Workout Splits</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {profile.fitnessExperience.toUpperCase()}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tailored progressive overload routines for your {profile.workoutDaysPerWeek}-day weekly training frequency.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="p-1 bg-slate-900 rounded-xl border border-slate-800 flex space-x-1">
          <button
            onClick={() => setSelectedWorkoutMode('home')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              selectedWorkoutMode === 'home'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Home / Calisthenics
          </button>
          <button
            onClick={() => setSelectedWorkoutMode('gym')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              selectedWorkoutMode === 'gym'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gym / Weight Training
          </button>
        </div>
      </div>

      {/* Safety and Principles Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-3">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p>
          <strong className="text-white">Fitness Fact:</strong> There is no such thing as "spot fat reduction." Muscle hypertrophy increases your basal metabolic rate, promoting fat burning sustainably across the entire body.
        </p>
      </div>

      {/* Routine Cards List */}
      <div className="space-y-6">
        {currentRoutines.map((routine, idx) => {
          const isDone = completedWorkouts.includes(routine.day);

          return (
            <div
              key={idx}
              className={`rounded-2xl p-6 border transition-all ${
                isDone
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300">
                      {routine.duration}
                    </span>
                    <span className="text-xs text-slate-400">&bull; {routine.difficulty}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {routine.day}
                  </h3>
                </div>

                <button
                  onClick={() => toggleWorkoutCompleted(routine.day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{isDone ? 'Completed' : 'Mark Complete'}</span>
                </button>
              </div>

              {/* Warm-Up & Mobility Section */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <span className="text-purple-400 font-semibold">Active Warm-Up: </span>
                <span className="text-slate-300">{routine.warmup}</span>
              </div>

              {/* Exercise Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Exercise Name</th>
                      <th className="py-2.5 px-3">Target Muscles</th>
                      <th className="py-2.5 px-3">Sets & Reps</th>
                      <th className="py-2.5 px-3">Rest</th>
                      <th className="py-2.5 px-3">Technique Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {routine.exercises.map((ex, exIdx) => (
                      <tr key={exIdx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                          {ex.name}
                        </td>
                        <td className="py-3 px-3 text-purple-300 whitespace-nowrap">
                          {ex.muscle}
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-mono">
                          {ex.sets} &bull; {ex.reps}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {ex.rest}
                        </td>
                        <td className="py-3 px-3 text-slate-300 min-w-[200px]">
                          {ex.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cool-Down */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-300">Cool-Down & Parasympathetic Reset:</strong> {routine.cooldown}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HydrationView({ calculations, todayWaterLoggedMl, handleWaterAdd, showToast }) {
  const { hydration } = calculations;
  const progressPct = Math.min(100, Math.round((todayWaterLoggedMl / hydration.totalMl) * 100));

  const hydrationSchedule = [
    { time: '07:30 AM', label: 'Upon waking', amount: '500 ml', reason: 'Rehydrate after overnight fasting' },
    { time: '10:30 AM', label: 'Mid-morning', amount: '400 ml', reason: 'Cognitive focus & cellular volume' },
    { time: '01:00 PM', label: '30 min before lunch', amount: '350 ml', reason: 'Digestive enzyme support' },
    { time: '04:30 PM', label: 'Pre-workout / Afternoon', amount: '500 ml', reason: 'Hydration cushion for exercise perspiration' },
    { time: '07:30 PM', label: 'Evening', amount: '350 ml', reason: 'Nutrient absorption' },
    { time: '09:30 PM', label: 'Before sleep', amount: '200 ml', reason: 'Hydration without disrupting sleep cycles' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center space-x-2">
          <span>Personalized Hydration Protocol</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {hydration.liters} Liters Target
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Formula adjusted for your body mass and weekly exercise sweating rates.
        </p>
      </div>

      {/* Main Hydration Progress Gauge Card */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center justify-center">
          {/* Circular Indicator */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPct) / 100}
                strokeLinecap="round"
                className="text-cyan-400 transition-all duration-700"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-white">{progressPct}%</span>
              <span className="text-xs text-slate-400">Complete</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Consumed</span>
              <div className="text-2xl font-black text-white mt-1">
                {(todayWaterLoggedMl / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-400">Liters</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Remaining</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {Math.max(0, (hydration.totalMl - todayWaterLoggedMl) / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-400">Liters</span>
              </div>
            </div>
          </div>

          {/* Quick-add buttons */}
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-2">Quick Log Water Intake</span>
            <div className="flex flex-wrap gap-2">
              {[
                { amount: 150, label: 'Cup (150ml)' },
                { amount: 250, label: 'Glass (250ml)' },
                { amount: 500, label: 'Bottle (500ml)' },
                { amount: 750, label: 'Sipper (750ml)' }
              ].map((btn) => (
                <button
                  key={btn.amount}
                  onClick={() => handleWaterAdd(btn.amount)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs border border-cyan-800 transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              ))}

              <button
                onClick={() => handleWaterAdd(-250)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                title="Subtract 250ml"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Drinking Schedule Table */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
        <h3 className="text-base font-bold text-white mb-4">
          Suggested Circadian Hydration Schedule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hydrationSchedule.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.time}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[11px]">
                  {item.amount}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">{item.label}</h4>
              <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalculatorsView({ profile, setProfile, calculations, showToast }) {
  const { bmr, tdee, bmiData, healthyRange, goalCalData, macros, timeline } = calculations;

  const handleGoalChange = (newGoal) => {
    setProfile((prev) => ({ ...prev, primaryGoal: newGoal }));
    showToast(`Updated goal to ${newGoal.replace('_', ' ')}!`);
  };

  const handleActivityChange = (newActivity) => {
    setProfile((prev) => ({ ...prev, activityLevel: newActivity }));
    showToast(`Activity set to ${newActivity}!`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white">
          Metabolic & Body Health Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Clinical formulas powered by the validated Mifflin–St Jeor equation.
        </p>
      </div>

      {/* Interactive Goal & Activity Switcher */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Your Primary Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'lose_weight', label: 'Sustainable Fat Loss', desc: '-450 kcal energy deficit', icon: TrendingDown },
              { id: 'maintain', label: 'Metabolic Maintenance', desc: 'Hold weight & optimize longevity', icon: Scale },
              { id: 'gain_muscle', label: 'Lean Muscle Hypertrophy', desc: '+350 kcal controlled surplus', icon: TrendingUp }
            ].map((g) => {
              const Icon = g.icon;
              const isSelected = profile.primaryGoal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => handleGoalChange(g.id)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm text-white">{g.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{g.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Level Selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Weekly Activity Multiplier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ACTIVITY_FACTORS).map(([key, data]) => {
              const isSelected = profile.activityLevel === key;
              return (
                <button
                  key={key}
                  onClick={() => handleActivityChange(key)}
                  className={`p-3 rounded-xl text-left border text-xs transition ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block text-white">{key.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{data.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calculations Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BMR */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Basal Metabolic Rate (BMR)</span>
          <div className="text-3xl font-black text-white mt-2">
            {bmr} <span className="text-sm font-normal text-slate-400">kcal/day</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Calories expended at absolute rest purely for vital organ function, respiration, and cellular homeostasis.
          </p>
        </div>

        {/* TDEE */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Daily Energy (TDEE)</span>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {tdee} <span className="text-sm font-normal text-slate-400">kcal/day</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Includes thermic effect of food (TEF), NEAT (non-exercise movement), and physical exercise sessions.
          </p>
        </div>

        {/* Goal Intake */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Prescribed Intake Target</span>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            {goalCalData.targetCalories} <span className="text-sm font-normal text-slate-400">kcal/day</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Deficit: {goalCalData.deficitOrSurplus} kcal. Clinically safe and protective against metabolic slowdown.
          </p>
        </div>
      </div>

      {/* BMI & Limitations Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-2">
          BMI Context & Biological Limitations
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your current BMI is <strong className="text-emerald-400 font-bold">{bmiData.value}</strong>, classifying in the <strong className="text-white">{bmiData.category}</strong> range. Note that standard BMI cannot differentiate muscle mass from adipose fat, bone density, or regional visceral fat distribution. Athletic individuals with high muscularity frequently score in the overweight bracket despite optimal metabolic health.
        </p>
      </div>
    </div>
  );
}

function AiCoachView({
  chatMessages,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  isChatLoading,
  chatBottomRef,
  profile
}) {
  const quickPrompts = [
    'How do I overcome a weight loss plateau sustainably?',
    'What are 3 high-protein vegetarian snacks?',
    'How to adjust calories on rest days vs workout days?',
    'Can I eat carbs at dinner without gaining fat?'
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[75vh]">
      {/* Coach Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>FitLife AI Nutrition & Fitness Coach</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                gemini-3-flash
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Evidence-based, personalized answers contextualized to your health profile.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-slate-900/90 rounded-2xl p-4 sm:p-6 border border-slate-800 overflow-y-auto space-y-4">
        {chatMessages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/80 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 rounded-2xl p-4 rounded-bl-none border border-slate-700 text-xs flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing metabolic profile & formulating response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex overflow-x-auto no-scrollbar space-x-2 py-1">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendChatMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs whitespace-nowrap border border-slate-700/60 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendChatMessage();
        }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={`Ask about meals, recipe substitutions, recovery, or form...`}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

function LogWeightModal({ currentWeight, newWeightInput, setNewWeightInput, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white">Record Weight Check-In</h3>
        <p className="text-xs text-slate-400 mt-1">
          Last recorded weight: <span className="text-emerald-400 font-bold">{currentWeight} kg</span>
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              New Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={newWeightInput}
              onChange={(e) => setNewWeightInput(e.target.value)}
              placeholder="e.g. 77.5"
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-base outline-none font-mono"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MealDetailsModal({ meal, onClose, onAskAi }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400">{meal.time} preparation</span>
            <h3 className="text-xl font-bold text-white mt-1">{meal.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Nutritional Facts Bar */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">Energy</span>
            <span className="text-xs font-bold text-white">{meal.cal} kcal</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Protein</span>
            <span className="text-xs font-bold text-emerald-400">{meal.p}g</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Carbs</span>
            <span className="text-xs font-bold text-amber-400">{meal.c}g</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Fats</span>
            <span className="text-xs font-bold text-rose-400">{meal.f}g</span>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Ingredients & Measure</h4>
          <ul className="space-y-1 text-xs text-slate-300">
            {meal.ingredients.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation Method */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Preparation Method</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {meal.instructions}
          </p>
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => onAskAi(meal.name)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI for Tips</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GroceryModal({ groceryList, onClose, showToast }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>Consolidated 7-Day Grocery List</span>
            </h3>
            <p className="text-xs text-slate-400">Estimated weekly pantry essentials for your meal plan.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {groceryList.map((cat, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">{cat.category}</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {cat.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Budget Estimate: <strong className="text-white">~₹1,200 – ₹1,800 ($20 - $25) / week</strong></span>
          <button
            onClick={() => {
              showToast('Grocery list exported to clipboard!');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
          >
            Copy List
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ profile, setProfile, onClose, showToast }) {
  const [formData, setFormData] = useState({ ...profile });

  const handleSubmit = (e) => {
    e.preventDefault();
    setProfile(formData);
    showToast('Health Profile successfully updated!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Health & Fitness Profile</h3>
            <p className="text-xs text-slate-400">Update parameters to recalibrate your metabolic equations.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 25 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Biological Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="male">Male (Mifflin equation +5)</option>
                <option value="female">Female (Mifflin equation -161)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 170 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.currentWeightKg}
                onChange={(e) => setFormData({ ...formData, currentWeightKg: parseFloat(e.target.value) || 70 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.targetWeightKg}
                onChange={(e) => setFormData({ ...formData, targetWeightKg: parseFloat(e.target.value) || 68 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Diet Preference</label>
              <select
                value={formData.dietaryPreference}
                onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non_vegetarian">Non-Vegetarian</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Workout Days/Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.workoutDaysPerWeek}
                onChange={(e) => setFormData({ ...formData, workoutDaysPerWeek: parseInt(e.target.value) || 4 })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              Apply Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}