/**
 * VITAL — Canonical biomarker seed dataset.
 *
 * Single source of truth for biomarker categories and the individual markers
 * VITAL tracks for the Egyptian preventive-health market. Consumed by the API
 * seed script and re-exported by the mobile client.
 *
 * Range invariant for every biomarker:
 *   min_plausible <= normal_low <= optimal_low <= optimal_high <= normal_high <= max_plausible
 */
import type { BiomarkerSeed, CategorySeed } from './types.js';

export const CATEGORY_SEED: CategorySeed[] = [
  {
    name: 'Metabolic Health',
    slug: 'metabolic',
    description:
      'Markers of how your body processes sugar and energy. They reveal early insulin resistance and diabetes risk long before symptoms appear.',
    icon: 'Flame',
    color: '#4CAF84',
    display_order: 1,
  },
  {
    name: 'Hormonal Panel',
    slug: 'hormonal',
    description:
      'Sex hormones, stress hormones and growth factors that govern energy, mood, libido, muscle and recovery across your whole body.',
    icon: 'Activity',
    color: '#C9A84C',
    display_order: 2,
  },
  {
    name: 'Cardiovascular',
    slug: 'cardiovascular',
    description:
      'Advanced heart and artery risk markers — particle counts, clotting factors and inflammation — that predict heart attack and stroke risk.',
    icon: 'Heart',
    color: '#E05252',
    display_order: 3,
  },
  {
    name: 'Vitamins & Nutrients',
    slug: 'nutritional',
    description:
      'Vitamins, minerals and fatty acids that fuel every cell. Deficiencies here drive fatigue, poor immunity and slow recovery.',
    icon: 'Apple',
    color: '#4A9FB5',
    display_order: 4,
  },
  {
    name: 'Inflammation',
    slug: 'inflammatory',
    description:
      'Chronic, low-grade inflammation silently accelerates ageing and disease. These markers measure how inflamed your body currently is.',
    icon: 'Gauge',
    color: '#E0844A',
    display_order: 5,
  },
  {
    name: 'Thyroid Function',
    slug: 'thyroid',
    description:
      'The thyroid sets your metabolic thermostat. These markers show whether your gland is under- or over-active and how well it is regulated.',
    icon: 'FlaskConical',
    color: '#9B7FD4',
    display_order: 6,
  },
  {
    name: 'Liver & Kidney',
    slug: 'hepatic',
    description:
      'Your two main filtration organs. These enzymes and waste products show how well your liver and kidneys are clearing toxins from your blood.',
    icon: 'Droplet',
    color: '#6B9E6B',
    display_order: 7,
  },
  {
    name: 'Complete Blood Count',
    slug: 'blood',
    description:
      'A full census of your red cells, white cells and platelets. It screens for anaemia, infection, immune issues and clotting problems.',
    icon: 'Droplets',
    color: '#B55A7A',
    display_order: 8,
  },
];

export const BIOMARKER_SEED: BiomarkerSeed[] = [
  // ───────────────────────── METABOLIC ─────────────────────────
  {
    category: 'metabolic',
    name: 'Fasting Glucose',
    slug: 'fasting-glucose',
    unit: 'mg/dL',
    description:
      'This measures the amount of sugar in your blood after you have not eaten for at least eight hours. It is the most basic snapshot of how your body manages fuel at rest. When it is too high, your cells are struggling to absorb sugar. It is the front-line test for diabetes screening.',
    why_it_matters:
      'Persistently high fasting glucose signals prediabetes or diabetes, which damage blood vessels, nerves, kidneys and eyes over time. Catching elevated levels early lets you reverse the trend through diet and exercise before permanent harm occurs.',
    what_affects_it:
      'Carbohydrate-heavy diets, weight gain, inactivity, poor sleep and stress all push it up. Regular exercise, weight loss and medications like metformin lower it, and it tracks closely with HbA1c and fasting insulin.',
    optimal_low: 70,
    optimal_high: 90,
    normal_low: 65,
    normal_high: 99,
    min_plausible: 20,
    max_plausible: 600,
    display_order: 1,
    tags: ['glucose', 'sugar', 'diabetes', 'insulin', 'metabolic'],
  },
  {
    category: 'metabolic',
    name: 'HbA1c',
    slug: 'hba1c',
    unit: '%',
    description:
      'This shows your average blood sugar over the past two to three months by measuring how much sugar has stuck to your red blood cells. Unlike a single glucose reading, it cannot be cheated by skipping breakfast. It gives a long-term picture of your sugar control. It is the gold-standard test for diagnosing and monitoring diabetes.',
    why_it_matters:
      'A rising HbA1c is one of the strongest predictors of diabetes complications including heart disease, kidney failure and nerve damage. Keeping it low dramatically reduces your lifetime risk of these conditions.',
    what_affects_it:
      'It reflects three months of dietary sugar and carbohydrate intake, body weight and activity level. Anaemia and recent blood loss can falsely lower it, and it moves in step with fasting glucose and fructosamine.',
    optimal_low: 4.5,
    optimal_high: 5.3,
    normal_low: 4.0,
    normal_high: 5.6,
    min_plausible: 3.0,
    max_plausible: 18.0,
    display_order: 2,
    tags: ['hba1c', 'glycation', 'diabetes', 'sugar', 'metabolic'],
  },
  {
    category: 'metabolic',
    name: 'Fasting Insulin',
    slug: 'fasting-insulin',
    unit: 'µIU/mL',
    description:
      'Insulin is the hormone that ushers sugar out of your blood and into your cells. This test measures how much of it is circulating while you are fasting. High levels mean your body is working overtime to keep sugar in check. It often rises years before blood sugar itself becomes abnormal.',
    why_it_matters:
      'Elevated fasting insulin is the earliest sign of insulin resistance, the root cause of type 2 diabetes, fatty liver and many cardiovascular problems. Detecting it early gives the longest possible window for prevention.',
    what_affects_it:
      'Excess body fat, refined carbohydrates, sedentary living and poor sleep raise it. Weight loss, strength training, fasting and a lower-carb diet bring it down, and it is the key input for the HOMA-IR calculation.',
    optimal_low: 2,
    optimal_high: 6,
    normal_low: 2,
    normal_high: 19,
    min_plausible: 0.5,
    max_plausible: 300,
    display_order: 3,
    tags: ['insulin', 'resistance', 'metabolic', 'diabetes', 'fasting'],
  },
  {
    category: 'metabolic',
    name: 'HOMA-IR',
    slug: 'homa-ir',
    unit: 'index',
    description:
      'This is a simple calculated score that combines your fasting glucose and fasting insulin into a single number. It estimates how resistant your body has become to insulin. A higher score means your cells are responding poorly to the hormone. It is one of the best early-warning indexes for metabolic disease.',
    why_it_matters:
      'A high HOMA-IR predicts type 2 diabetes, fatty liver and metabolic syndrome well before standard glucose tests turn abnormal. It quantifies a problem that is otherwise invisible until it is advanced.',
    what_affects_it:
      'It rises with abdominal fat, inactivity and a high-sugar diet, and falls with weight loss, exercise and better sleep. Because it is derived from glucose and insulin, anything that changes those two markers changes this score.',
    optimal_low: 0.5,
    optimal_high: 1.5,
    normal_low: 0.5,
    normal_high: 2.0,
    min_plausible: 0.1,
    max_plausible: 50,
    display_order: 4,
    tags: ['homa', 'insulin', 'resistance', 'metabolic', 'index'],
  },
  {
    category: 'metabolic',
    name: 'C-Peptide',
    slug: 'c-peptide',
    unit: 'ng/mL',
    description:
      'When your pancreas makes insulin it releases an equal amount of a by-product called C-peptide. Measuring it tells doctors how much insulin your own body is producing. Because it lasts longer in the blood than insulin, it gives a steadier reading. It helps distinguish between different types of diabetes.',
    why_it_matters:
      'C-peptide shows whether a diabetic still produces their own insulin, which guides treatment choices. Very high levels point to insulin resistance, while very low levels indicate the pancreas is failing.',
    what_affects_it:
      'It rises with insulin resistance, obesity and high carbohydrate intake, and drops as the insulin-producing cells of the pancreas wear out. Kidney disease can raise it because the kidneys clear it from the blood.',
    optimal_low: 0.8,
    optimal_high: 2.0,
    normal_low: 0.5,
    normal_high: 2.7,
    min_plausible: 0.05,
    max_plausible: 15,
    display_order: 5,
    tags: ['c-peptide', 'insulin', 'pancreas', 'metabolic', 'diabetes'],
  },
  {
    category: 'metabolic',
    name: 'Fructosamine',
    slug: 'fructosamine',
    unit: 'µmol/L',
    description:
      'This measures sugar that has attached to proteins in your blood over the past two to three weeks. It is a shorter-term version of the HbA1c test. It is especially useful when red-blood-cell conditions make HbA1c unreliable. It captures recent changes in sugar control faster.',
    why_it_matters:
      'Fructosamine reveals short-term swings in blood sugar that a three-month average would miss, helping fine-tune diabetes management. It is a valuable check when HbA1c cannot be trusted, such as in anaemia or pregnancy.',
    what_affects_it:
      'Recent dietary sugar and carbohydrate intake move it within two to three weeks. Low protein levels and high vitamin C intake can falsely lower it, and it tracks with glucose and HbA1c.',
    optimal_low: 200,
    optimal_high: 260,
    normal_low: 200,
    normal_high: 285,
    min_plausible: 100,
    max_plausible: 1000,
    display_order: 6,
    tags: ['fructosamine', 'glycation', 'sugar', 'metabolic', 'short-term'],
  },
  {
    category: 'metabolic',
    name: '2hr Post-load Glucose',
    slug: 'post-load-glucose-2hr',
    unit: 'mg/dL',
    description:
      'For this test you drink a sugary solution and your blood sugar is measured two hours later. It shows how well your body clears a large sugar load. A high result means your cells are slow to absorb sugar. It can uncover diabetes that fasting tests miss.',
    why_it_matters:
      'Some people have normal fasting sugar but fail this challenge, revealing hidden prediabetes or diabetes. It is one of the most sensitive ways to catch impaired glucose handling early.',
    what_affects_it:
      'Insulin resistance, inactivity and excess weight raise the two-hour value, while exercise and weight loss improve it. Recent carbohydrate intake and certain medications such as steroids can push it higher.',
    optimal_low: 70,
    optimal_high: 120,
    normal_low: 70,
    normal_high: 139,
    min_plausible: 30,
    max_plausible: 600,
    display_order: 7,
    tags: ['glucose', 'ogtt', 'tolerance', 'metabolic', 'diabetes'],
  },
  {
    category: 'metabolic',
    name: 'Uric Acid',
    slug: 'uric-acid',
    unit: 'mg/dL',
    description:
      'Uric acid is a waste product made when your body breaks down certain foods and its own cells. It normally dissolves in blood and leaves through the kidneys. When levels climb too high, sharp crystals can form in the joints. It is closely tied to diet and metabolic health.',
    why_it_matters:
      'High uric acid causes gout and kidney stones and is linked to high blood pressure, fatty liver and insulin resistance. Lowering it reduces painful flares and supports overall metabolic health.',
    what_affects_it:
      'Red meat, seafood, alcohol and sugary drinks raise it, while hydration, weight loss and certain medications lower it. It rises with kidney problems and tends to accompany metabolic syndrome.',
    optimal_low: 3.5,
    optimal_high: 5.5,
    normal_low: 2.5,
    normal_high: 7.0,
    min_plausible: 0.5,
    max_plausible: 20,
    display_order: 8,
    tags: ['uric-acid', 'gout', 'metabolic', 'kidney', 'purine'],
  },
  {
    category: 'metabolic',
    name: 'Lactate Dehydrogenase',
    slug: 'ldh',
    unit: 'U/L',
    description:
      'This enzyme is found in almost every cell in the body and is released when cells are damaged. Measuring it gives a general signal that tissue somewhere is under stress. It is not specific to one organ but flags that something needs attention. It is often checked alongside other markers.',
    why_it_matters:
      'Elevated LDH can indicate cell injury from infection, muscle damage, blood disorders or organ stress. It serves as a broad alarm that prompts further, more targeted testing.',
    what_affects_it:
      'Intense exercise, muscle injury, infections and certain anaemias raise it. Hemolysis of the blood sample itself can falsely elevate the reading, so collection technique matters.',
    optimal_low: 140,
    optimal_high: 200,
    normal_low: 120,
    normal_high: 246,
    min_plausible: 50,
    max_plausible: 3000,
    display_order: 9,
    tags: ['ldh', 'enzyme', 'tissue', 'metabolic', 'cell-damage'],
  },
  {
    category: 'metabolic',
    name: 'Triglycerides',
    slug: 'triglycerides',
    unit: 'mg/dL',
    description:
      'Triglycerides are the most common type of fat in your blood and the main way your body stores extra energy. After a meal, unused calories are turned into triglycerides. High levels usually reflect too much sugar, alcohol or refined carbohydrate. They are a core part of any cholesterol panel.',
    why_it_matters:
      'High triglycerides raise the risk of heart disease and, at extreme levels, can inflame the pancreas. They are also a hallmark of insulin resistance and metabolic syndrome.',
    what_affects_it:
      'Sugar, refined carbs and alcohol drive them up, while low-carb eating, omega-3 fats, exercise and weight loss bring them down. They rise after eating, so this test requires fasting.',
    optimal_low: 40,
    optimal_high: 90,
    normal_low: 40,
    normal_high: 149,
    min_plausible: 10,
    max_plausible: 5000,
    display_order: 10,
    tags: ['triglycerides', 'lipids', 'fat', 'metabolic', 'cholesterol'],
  },
  {
    category: 'metabolic',
    name: 'HDL Cholesterol',
    slug: 'hdl-cholesterol',
    unit: 'mg/dL',
    description:
      'HDL is often called the good cholesterol because it carries excess cholesterol away from your arteries back to the liver for disposal. Higher levels generally protect your heart. It acts like a clean-up crew for your blood vessels. It is a standard part of every lipid panel.',
    why_it_matters:
      'Low HDL is an independent risk factor for heart attack and stroke, while higher levels are protective. It is an important counterbalance to the artery-clogging LDL particles.',
    what_affects_it:
      'Exercise, healthy fats and moderate activity raise it, while smoking, excess sugar and inactivity lower it. Genetics play a large role, and very high triglycerides tend to push HDL down.',
    optimal_low: 60,
    optimal_high: 90,
    normal_low: 40,
    normal_high: 100,
    min_plausible: 10,
    max_plausible: 200,
    display_order: 11,
    tags: ['hdl', 'cholesterol', 'lipids', 'metabolic', 'good-cholesterol'],
  },
  {
    category: 'metabolic',
    name: 'LDL Cholesterol',
    slug: 'ldl-cholesterol',
    unit: 'mg/dL',
    description:
      'LDL is often called the bad cholesterol because it deposits cholesterol into the walls of your arteries. Over time this can build into plaques that narrow the vessels. It is one of the most important numbers for heart-disease risk. It is calculated or measured in every lipid panel.',
    why_it_matters:
      'High LDL is a primary driver of atherosclerosis, heart attacks and strokes. Lowering it is one of the most proven ways to reduce cardiovascular risk over a lifetime.',
    what_affects_it:
      'Saturated and trans fats, genetics and an underactive thyroid raise it, while fibre, exercise and statin medications lower it. It tracks closely with ApoB, which counts the actual particle number.',
    optimal_low: 50,
    optimal_high: 99,
    normal_low: 50,
    normal_high: 129,
    min_plausible: 10,
    max_plausible: 500,
    display_order: 12,
    tags: ['ldl', 'cholesterol', 'lipids', 'metabolic', 'bad-cholesterol'],
  },
  {
    category: 'metabolic',
    name: 'Glucose-to-Insulin Ratio',
    slug: 'glucose-insulin-ratio',
    unit: 'ratio',
    description:
      'This compares your fasting glucose to your fasting insulin as a single ratio. A low ratio suggests your body needs lots of insulin to control normal sugar, a sign of resistance. It is another simple lens on metabolic efficiency. It complements the HOMA-IR score.',
    why_it_matters:
      'A low glucose-to-insulin ratio flags insulin resistance and is associated with conditions like polycystic ovary syndrome and metabolic syndrome. It helps round out the metabolic picture.',
    what_affects_it:
      'Body fat, diet and activity shift both inputs, so the same factors that affect glucose and insulin affect this ratio. Improving insulin sensitivity raises the ratio over time.',
    optimal_low: 7,
    optimal_high: 25,
    normal_low: 4.5,
    normal_high: 30,
    min_plausible: 0.5,
    max_plausible: 100,
    display_order: 13,
    tags: ['ratio', 'insulin', 'glucose', 'metabolic', 'resistance'],
  },

  // ───────────────────────── HORMONAL ─────────────────────────
  {
    category: 'hormonal',
    name: 'Total Testosterone',
    slug: 'total-testosterone',
    unit: 'ng/dL',
    description:
      'This measures the total amount of testosterone in your blood, both the active free portion and the part bound to proteins. Testosterone drives muscle, bone strength, libido and energy in both men and women. It naturally declines with age. It is the headline number on any male hormone panel.',
    why_it_matters:
      'Low testosterone causes fatigue, low libido, depressed mood, muscle loss and reduced bone density. It is also linked to insulin resistance and cardiovascular risk, making it important for overall vitality.',
    what_affects_it:
      'Sleep, strength training, body fat, stress and alcohol all influence it, and it falls with age and chronic illness. SHBG levels strongly affect how much testosterone is actually available to your tissues.',
    optimal_low: 500,
    optimal_high: 900,
    normal_low: 280,
    normal_high: 1000,
    min_plausible: 5,
    max_plausible: 3000,
    display_order: 1,
    tags: ['testosterone', 'hormones', 'androgen', 'libido', 'muscle'],
  },
  {
    category: 'hormonal',
    name: 'Free Testosterone',
    slug: 'free-testosterone',
    unit: 'pg/mL',
    description:
      'This measures only the testosterone that is unbound and free to act on your cells. It is the biologically active portion that actually drives effects in the body. It can be low even when total testosterone looks normal. It gives a more accurate picture of hormone availability.',
    why_it_matters:
      'Free testosterone better reflects symptoms of low or high androgens than the total number. It is especially useful when protein-binding levels are abnormal, which would otherwise mask a problem.',
    what_affects_it:
      'High SHBG lowers it while obesity and insulin resistance can raise the free fraction. Sleep, stress, age and body composition all shift it, as they do total testosterone.',
    optimal_low: 90,
    optimal_high: 250,
    normal_low: 47,
    normal_high: 280,
    min_plausible: 1,
    max_plausible: 700,
    display_order: 2,
    tags: ['testosterone', 'free', 'hormones', 'androgen', 'bioavailable'],
  },
  {
    category: 'hormonal',
    name: 'SHBG',
    slug: 'shbg',
    unit: 'nmol/L',
    description:
      'Sex hormone binding globulin is a protein that grabs onto testosterone and estrogen and carries them through the blood. While bound, these hormones cannot act on your cells. So this protein controls how much of your sex hormones are actually usable. It is key to interpreting testosterone results.',
    why_it_matters:
      'High SHBG lowers the amount of free, active testosterone, causing low-testosterone symptoms even when the total looks fine. Low SHBG often signals insulin resistance and excess free hormone activity.',
    what_affects_it:
      'It rises with ageing, thyroid hormone and estrogen, and falls with insulin resistance, obesity and high androgen levels. Liver health strongly affects it because the liver produces this protein.',
    optimal_low: 25,
    optimal_high: 45,
    normal_low: 16,
    normal_high: 55,
    min_plausible: 2,
    max_plausible: 200,
    display_order: 3,
    tags: ['shbg', 'binding', 'hormones', 'testosterone', 'estrogen'],
  },
  {
    category: 'hormonal',
    name: 'Estradiol',
    slug: 'estradiol',
    unit: 'pg/mL',
    description:
      'Estradiol is the main and most potent form of estrogen. It governs the menstrual cycle, fertility and bone health in women, and plays smaller but important roles in men. Levels vary widely across the menstrual cycle. It is central to reproductive and bone health.',
    why_it_matters:
      'Balanced estradiol protects bones, mood and cardiovascular health, while too little after menopause raises osteoporosis risk. In men, both too much and too little estradiol can cause problems with libido and body composition.',
    what_affects_it:
      'In women it swings with the menstrual cycle and drops sharply at menopause. Body fat converts testosterone into estradiol, so obesity raises it, and certain medications can block or boost it.',
    optimal_low: 30,
    optimal_high: 150,
    normal_low: 15,
    normal_high: 350,
    min_plausible: 2,
    max_plausible: 1000,
    display_order: 4,
    tags: ['estradiol', 'estrogen', 'hormones', 'fertility', 'bone'],
  },
  {
    category: 'hormonal',
    name: 'Progesterone',
    slug: 'progesterone',
    unit: 'ng/mL',
    description:
      'Progesterone is a hormone that prepares the womb for pregnancy and balances the effects of estrogen. It peaks in the second half of the menstrual cycle. It also influences mood and sleep. Its level is a key marker of ovulation and fertility.',
    why_it_matters:
      'Adequate progesterone is essential for healthy menstrual cycles and maintaining early pregnancy. Low levels can cause irregular cycles, difficulty conceiving and poor sleep.',
    what_affects_it:
      'It is highest after ovulation and during pregnancy, and is essentially low before ovulation. Stress, ovulation problems and the timing of the blood draw within the cycle all strongly affect the reading.',
    optimal_low: 1,
    optimal_high: 20,
    normal_low: 0.2,
    normal_high: 25,
    min_plausible: 0.05,
    max_plausible: 300,
    display_order: 5,
    tags: ['progesterone', 'hormones', 'fertility', 'ovulation', 'cycle'],
  },
  {
    category: 'hormonal',
    name: 'DHEA-S',
    slug: 'dhea-s',
    unit: 'µg/dL',
    description:
      'DHEA-S is a hormone made by your adrenal glands that serves as a building block for testosterone and estrogen. It is one of the most abundant hormones in the body. Levels peak in young adulthood and decline steadily with age. It is a useful marker of adrenal output and vitality.',
    why_it_matters:
      'DHEA-S reflects adrenal health and is tied to energy, mood, immune function and healthy ageing. Very high levels can indicate adrenal disorders, while very low levels are common in chronic stress and ageing.',
    what_affects_it:
      'It declines naturally with age and drops with chronic stress and illness. Sleep, exercise and overall adrenal health influence it, and supplementation can artificially raise it.',
    optimal_low: 200,
    optimal_high: 400,
    normal_low: 80,
    normal_high: 560,
    min_plausible: 5,
    max_plausible: 2000,
    display_order: 6,
    tags: ['dhea', 'adrenal', 'hormones', 'ageing', 'androgen'],
  },
  {
    category: 'hormonal',
    name: 'Cortisol (Morning)',
    slug: 'cortisol-morning',
    unit: 'µg/dL',
    description:
      'Cortisol is your main stress hormone, released by the adrenal glands in a daily rhythm. It is naturally highest in the morning to wake you up and lowest at night. This test captures that morning peak. It reflects how your stress system is functioning.',
    why_it_matters:
      'Abnormal morning cortisol can indicate chronic stress, adrenal disorders or pituitary problems. Both excess and deficiency disrupt blood sugar, blood pressure, immunity and sleep.',
    what_affects_it:
      'Stress, poor sleep, shift work, caffeine and the exact time of the blood draw all strongly affect it. Certain medications, including steroids and birth control, alter the reading.',
    optimal_low: 10,
    optimal_high: 18,
    normal_low: 6,
    normal_high: 23,
    min_plausible: 0.5,
    max_plausible: 80,
    display_order: 7,
    tags: ['cortisol', 'stress', 'adrenal', 'hormones', 'morning'],
  },
  {
    category: 'hormonal',
    name: 'Cortisol (PM)',
    slug: 'cortisol-pm',
    unit: 'µg/dL',
    description:
      'This measures cortisol in the late afternoon or evening, when it should naturally be low. Comparing it to the morning level shows whether your daily stress rhythm is healthy. A flat or elevated evening level suggests dysregulation. It helps map the full cortisol curve.',
    why_it_matters:
      'A high evening cortisol disrupts sleep and recovery and points to chronic stress or adrenal problems. The morning-to-evening drop is a key sign of a healthy stress-hormone rhythm.',
    what_affects_it:
      'Evening stress, late caffeine, screen exposure and irregular sleep raise it. Shift work and chronic stress flatten the normal decline that should occur through the day.',
    optimal_low: 2,
    optimal_high: 8,
    normal_low: 2,
    normal_high: 12,
    min_plausible: 0.2,
    max_plausible: 60,
    display_order: 8,
    tags: ['cortisol', 'stress', 'evening', 'rhythm', 'hormones'],
  },
  {
    category: 'hormonal',
    name: 'LH (Luteinizing Hormone)',
    slug: 'lh',
    unit: 'mIU/mL',
    description:
      'LH is released by the pituitary gland in your brain to signal the ovaries or testes. In women it triggers ovulation, and in men it stimulates testosterone production. It works as a master control signal for reproduction. Its level helps locate the source of hormone problems.',
    why_it_matters:
      'LH patterns reveal whether a hormone problem comes from the gonads themselves or from the brain that controls them. Abnormal levels are central to diagnosing infertility, menopause and conditions like PCOS.',
    what_affects_it:
      'It surges at ovulation in women and rises after menopause when the ovaries stop responding. Pituitary disorders, stress and certain medications change it, and timing within the cycle matters greatly.',
    optimal_low: 2,
    optimal_high: 9,
    normal_low: 1.5,
    normal_high: 12,
    min_plausible: 0.1,
    max_plausible: 200,
    display_order: 9,
    tags: ['lh', 'pituitary', 'fertility', 'hormones', 'reproduction'],
  },
  {
    category: 'hormonal',
    name: 'FSH (Follicle Stimulating Hormone)',
    slug: 'fsh',
    unit: 'mIU/mL',
    description:
      'FSH is another pituitary hormone that signals the ovaries and testes. In women it helps eggs mature each cycle, and in men it supports sperm production. Like LH, it is a control signal from the brain. Its level is a key fertility and menopause marker.',
    why_it_matters:
      'A high FSH is one of the clearest signs that the ovaries are failing, as in menopause or premature ovarian insufficiency. In men it helps evaluate sperm production and the cause of low testosterone.',
    what_affects_it:
      'It rises sharply at menopause and varies across the menstrual cycle. Pituitary problems, certain medications and the timing of the blood draw all affect it.',
    optimal_low: 3,
    optimal_high: 8,
    normal_low: 1.5,
    normal_high: 12.5,
    min_plausible: 0.1,
    max_plausible: 200,
    display_order: 10,
    tags: ['fsh', 'pituitary', 'fertility', 'menopause', 'hormones'],
  },
  {
    category: 'hormonal',
    name: 'Prolactin',
    slug: 'prolactin',
    unit: 'ng/mL',
    description:
      'Prolactin is the hormone that enables breast-milk production after childbirth. It is present in both men and women at low levels the rest of the time. When abnormally high outside of pregnancy, it can disrupt other hormones. It is checked when periods stop or libido drops.',
    why_it_matters:
      'High prolactin suppresses testosterone and estrogen, causing infertility, low libido and irregular periods. A markedly elevated level can signal a benign pituitary tumour that needs treatment.',
    what_affects_it:
      'Stress, nipple stimulation, sleep, certain medications and a recent meal can raise it. Pituitary tumours and an underactive thyroid are important medical causes of elevation.',
    optimal_low: 3,
    optimal_high: 15,
    normal_low: 2,
    normal_high: 25,
    min_plausible: 0.5,
    max_plausible: 500,
    display_order: 11,
    tags: ['prolactin', 'pituitary', 'hormones', 'fertility', 'libido'],
  },
  {
    category: 'hormonal',
    name: 'IGF-1',
    slug: 'igf-1',
    unit: 'ng/mL',
    description:
      'IGF-1 is a hormone produced mainly by the liver in response to growth hormone. It carries out most of growth hormone’s effects on muscle, bone and tissue repair. Because it is stable in the blood, it is the best everyday marker of growth-hormone activity. It reflects anabolic, repair-related health.',
    why_it_matters:
      'IGF-1 supports muscle maintenance, recovery and bone strength, and it declines with age. Both very high and very low levels carry health risks, with extremes linked to growth disorders and altered longevity.',
    what_affects_it:
      'Protein intake, sleep, exercise and growth-hormone status raise it, while ageing, fasting and liver disease lower it. It is the steady marker doctors use instead of the highly variable growth hormone itself.',
    optimal_low: 150,
    optimal_high: 280,
    normal_low: 90,
    normal_high: 360,
    min_plausible: 20,
    max_plausible: 1000,
    display_order: 12,
    tags: ['igf-1', 'growth', 'hormones', 'muscle', 'longevity'],
  },
  {
    category: 'hormonal',
    name: 'Growth Hormone',
    slug: 'growth-hormone',
    unit: 'ng/mL',
    description:
      'Growth hormone is released by the pituitary in pulses, mostly during deep sleep. It drives growth in childhood and tissue repair and metabolism in adults. Because it is released in bursts, a single reading varies a lot. It is usually interpreted alongside IGF-1.',
    why_it_matters:
      'Growth hormone supports muscle, bone and fat metabolism, and both deficiency and excess cause distinct disorders. Excess in adults leads to acromegaly, while deficiency causes fatigue and poor body composition.',
    what_affects_it:
      'Deep sleep, exercise, fasting and stress trigger natural pulses. Because levels swing widely through the day, the steadier IGF-1 marker is often preferred for assessment.',
    optimal_low: 0.5,
    optimal_high: 3,
    normal_low: 0.1,
    normal_high: 5,
    min_plausible: 0.01,
    max_plausible: 50,
    display_order: 13,
    tags: ['growth-hormone', 'pituitary', 'hormones', 'repair', 'metabolism'],
  },

  // ───────────────────────── CARDIOVASCULAR ─────────────────────────
  {
    category: 'cardiovascular',
    name: 'Total Cholesterol',
    slug: 'total-cholesterol',
    unit: 'mg/dL',
    description:
      'This is the sum of all the cholesterol carried in your blood, including the good and bad types. Cholesterol is a waxy substance your body needs to build cells and hormones. Too much of the wrong kind, however, clogs arteries. It is the starting point of every lipid panel.',
    why_it_matters:
      'While useful as a screen, total cholesterol matters most when broken into its parts, since high LDL drives heart disease but high HDL protects. It gives a quick overview of cardiovascular risk that more detailed tests then refine.',
    what_affects_it:
      'Diet, genetics, thyroid function and body weight all influence it. Saturated fat and an underactive thyroid raise it, while exercise and fibre help lower it.',
    optimal_low: 140,
    optimal_high: 199,
    normal_low: 120,
    normal_high: 239,
    min_plausible: 50,
    max_plausible: 600,
    display_order: 1,
    tags: ['cholesterol', 'lipids', 'cardiovascular', 'heart', 'screening'],
  },
  {
    category: 'cardiovascular',
    name: 'ApoB',
    slug: 'apob',
    unit: 'mg/dL',
    description:
      'ApoB is a protein found on every artery-clogging cholesterol particle, so counting it tells you the true number of harmful particles in your blood. It is considered a more accurate risk marker than LDL alone. Each ApoB particle can lodge in an artery wall. It is increasingly the preferred heart-risk test.',
    why_it_matters:
      'ApoB predicts heart attack and stroke risk more reliably than standard cholesterol numbers because risk depends on particle count, not just cholesterol weight. Lowering it is a direct way to reduce cardiovascular events.',
    what_affects_it:
      'Saturated fat, genetics, insulin resistance and an underactive thyroid raise it, while statins, fibre and exercise lower it. It tracks closely with LDL but captures risk that LDL can miss.',
    optimal_low: 40,
    optimal_high: 80,
    normal_low: 40,
    normal_high: 100,
    min_plausible: 10,
    max_plausible: 300,
    display_order: 2,
    tags: ['apob', 'lipids', 'cardiovascular', 'particle', 'heart'],
  },
  {
    category: 'cardiovascular',
    name: 'ApoA1',
    slug: 'apoa1',
    unit: 'mg/dL',
    description:
      'ApoA1 is the main protein found on protective HDL particles. It helps HDL pull excess cholesterol out of artery walls. Higher levels generally indicate stronger cardiovascular protection. It is the counterpart to the harmful ApoB.',
    why_it_matters:
      'A high ApoA1 reflects effective cholesterol clearance and lower heart-disease risk. The ratio of ApoB to ApoA1 is one of the strongest single predictors of heart-attack risk.',
    what_affects_it:
      'Exercise, healthy fats and moderate alcohol raise it, while smoking, obesity and inactivity lower it. Genetics strongly influence the level, much as they do HDL.',
    optimal_low: 140,
    optimal_high: 200,
    normal_low: 110,
    normal_high: 220,
    min_plausible: 40,
    max_plausible: 350,
    display_order: 3,
    tags: ['apoa1', 'hdl', 'cardiovascular', 'protective', 'heart'],
  },
  {
    category: 'cardiovascular',
    name: 'Lp(a)',
    slug: 'lp-a',
    unit: 'mg/dL',
    description:
      'Lipoprotein(a) is a special type of cholesterol particle whose level is set almost entirely by your genes. Unlike other lipids, it changes very little with diet or exercise. A high level is an inherited risk you are largely born with. It is usually measured just once in a lifetime.',
    why_it_matters:
      'High Lp(a) is a strong, independent and inherited risk factor for heart attack, stroke and aortic valve disease. Knowing it identifies people who need more aggressive management of their other risk factors.',
    what_affects_it:
      'It is overwhelmingly genetic and barely responds to lifestyle changes. Hormone status can shift it slightly, and a few emerging drugs are being developed specifically to lower it.',
    optimal_low: 0,
    optimal_high: 30,
    normal_low: 0,
    normal_high: 50,
    min_plausible: 0,
    max_plausible: 500,
    display_order: 4,
    tags: ['lp-a', 'genetic', 'cardiovascular', 'lipids', 'inherited'],
  },
  {
    category: 'cardiovascular',
    name: 'hsCRP',
    slug: 'hscrp-cardiac',
    unit: 'mg/L',
    description:
      'This high-sensitivity test measures very low levels of C-reactive protein, a marker of inflammation in the body. In a cardiovascular context it reflects inflammation inside the artery walls. Low-grade inflammation quietly drives plaque formation. It adds risk information beyond cholesterol.',
    why_it_matters:
      'A high hsCRP signals vascular inflammation and predicts heart attack and stroke even when cholesterol is normal. It helps refine risk and guide how aggressively to treat.',
    what_affects_it:
      'Obesity, smoking, infections, poor diet and stress raise it, while exercise, weight loss and an anti-inflammatory diet lower it. Any recent infection can temporarily spike it, so timing matters.',
    optimal_low: 0,
    optimal_high: 1.0,
    normal_low: 0,
    normal_high: 3.0,
    min_plausible: 0,
    max_plausible: 100,
    display_order: 5,
    tags: ['hscrp', 'inflammation', 'cardiovascular', 'crp', 'heart'],
  },
  {
    category: 'cardiovascular',
    name: 'Homocysteine',
    slug: 'homocysteine',
    unit: 'µmol/L',
    description:
      'Homocysteine is an amino acid that your body normally clears using B vitamins. When those vitamins are low, it builds up in the blood. High levels can damage the lining of blood vessels. It links nutrition directly to heart and brain health.',
    why_it_matters:
      'Elevated homocysteine is associated with higher risk of heart attack, stroke, blood clots and cognitive decline. Because it often reflects vitamin deficiency, it is frequently correctable.',
    what_affects_it:
      'Low folate, B12 and B6 raise it, while supplementing these vitamins lowers it. Kidney disease, smoking and certain genetic variants also push it up.',
    optimal_low: 5,
    optimal_high: 8,
    normal_low: 4,
    normal_high: 12,
    min_plausible: 1,
    max_plausible: 100,
    display_order: 6,
    tags: ['homocysteine', 'cardiovascular', 'b-vitamins', 'vessels', 'heart'],
  },
  {
    category: 'cardiovascular',
    name: 'Fibrinogen',
    slug: 'fibrinogen-cardiac',
    unit: 'mg/dL',
    description:
      'Fibrinogen is a protein your blood uses to form clots and stop bleeding. It is also a marker of inflammation. In a heart context, high levels make the blood more prone to clotting. It connects clotting tendency with cardiovascular risk.',
    why_it_matters:
      'High fibrinogen increases the risk of dangerous clots that cause heart attacks and strokes. It also reflects underlying inflammation, doubling as a risk and inflammation marker.',
    what_affects_it:
      'Smoking, obesity, infection and inflammation raise it, while exercise and not smoking help keep it lower. It rises naturally with age and during acute illness.',
    optimal_low: 200,
    optimal_high: 350,
    normal_low: 200,
    normal_high: 400,
    min_plausible: 50,
    max_plausible: 1000,
    display_order: 7,
    tags: ['fibrinogen', 'clotting', 'cardiovascular', 'inflammation', 'heart'],
  },
  {
    category: 'cardiovascular',
    name: 'NT-proBNP',
    slug: 'nt-probnp',
    unit: 'pg/mL',
    description:
      'This is a substance released by the heart when its chambers are stretched or under strain. Higher levels mean the heart is working harder than it should. It is a sensitive signal of heart-pumping problems. It is widely used to assess heart failure.',
    why_it_matters:
      'NT-proBNP is a leading marker for diagnosing and monitoring heart failure, rising before symptoms become severe. Low levels reassure that the heart is not under significant strain.',
    what_affects_it:
      'Heart failure, high blood pressure and valve disease raise it, and it climbs naturally with age and in kidney disease. Obesity tends to lower the reading, which must be kept in mind.',
    optimal_low: 0,
    optimal_high: 50,
    normal_low: 0,
    normal_high: 125,
    min_plausible: 0,
    max_plausible: 35000,
    display_order: 8,
    tags: ['nt-probnp', 'heart-failure', 'cardiovascular', 'strain', 'heart'],
  },

  // ───────────────────────── NUTRITIONAL ─────────────────────────
  {
    category: 'nutritional',
    name: 'Vitamin D3 (25-OH)',
    slug: 'vitamin-d-25oh',
    unit: 'ng/mL',
    description:
      'This measures the storage form of vitamin D, which your skin makes from sunlight and you get from a few foods. Vitamin D helps you absorb calcium and supports immunity, mood and muscles. It is the best test of your overall vitamin D status. Deficiency is extremely common.',
    why_it_matters:
      'Low vitamin D weakens bones, dampens immunity and is linked to fatigue, low mood and higher infection risk. Maintaining adequate levels supports bone strength, immune defence and overall vitality.',
    what_affects_it:
      'Sun exposure, skin tone, latitude, indoor lifestyles and supplementation determine it, with deficiency widespread in sun-rich but covered populations. Obesity lowers the available level because vitamin D is stored in fat.',
    optimal_low: 40,
    optimal_high: 60,
    normal_low: 30,
    normal_high: 80,
    min_plausible: 3,
    max_plausible: 150,
    display_order: 1,
    tags: ['vitamin-d', 'bone', 'immunity', 'nutritional', 'sunlight'],
  },
  {
    category: 'nutritional',
    name: 'Vitamin B12',
    slug: 'vitamin-b12',
    unit: 'pg/mL',
    description:
      'Vitamin B12 is essential for making red blood cells, DNA and a healthy nervous system. It comes mainly from animal foods. Low levels can cause anaemia and nerve damage. It is a key nutrient to check for fatigue and tingling.',
    why_it_matters:
      'B12 deficiency causes anaemia, fatigue, memory problems and potentially permanent nerve damage if untreated. It is common in vegetarians, older adults and people on certain medications.',
    what_affects_it:
      'A low intake of animal foods, gut absorption problems and medications like metformin and acid-blockers lower it. Stomach conditions that reduce absorption are an important cause of deficiency.',
    optimal_low: 500,
    optimal_high: 900,
    normal_low: 200,
    normal_high: 950,
    min_plausible: 50,
    max_plausible: 3000,
    display_order: 2,
    tags: ['b12', 'nerves', 'anaemia', 'nutritional', 'energy'],
  },
  {
    category: 'nutritional',
    name: 'Folate',
    slug: 'folate',
    unit: 'ng/mL',
    description:
      'Folate, also known as vitamin B9, is needed to make DNA and healthy red blood cells. It is found in leafy greens, legumes and fortified grains. It is especially important before and during pregnancy. Low levels cause a type of anaemia.',
    why_it_matters:
      'Folate deficiency causes anaemia and, in pregnancy, raises the risk of serious birth defects. Adequate folate also helps keep homocysteine low, protecting the heart.',
    what_affects_it:
      'A diet low in green vegetables and legumes, alcohol and certain medications lower it. It works hand in hand with B12, and a deficiency in one can mask problems with the other.',
    optimal_low: 10,
    optimal_high: 20,
    normal_low: 4,
    normal_high: 24,
    min_plausible: 0.5,
    max_plausible: 50,
    display_order: 3,
    tags: ['folate', 'b9', 'anaemia', 'nutritional', 'pregnancy'],
  },
  {
    category: 'nutritional',
    name: 'Ferritin',
    slug: 'ferritin',
    unit: 'ng/mL',
    description:
      'Ferritin is the protein that stores iron in your body, so it reflects your iron reserves. It is the best single test for spotting iron deficiency before anaemia develops. It can also rise as part of inflammation. It is central to evaluating fatigue and hair loss.',
    why_it_matters:
      'Low ferritin signals depleted iron stores, a leading cause of fatigue, hair loss and anaemia, especially in women. Very high ferritin can indicate iron overload or active inflammation.',
    what_affects_it:
      'Blood loss, heavy periods, low iron intake and poor absorption lower it, while iron supplements and red meat raise it. Because it rises during inflammation, it must be read alongside hsCRP.',
    optimal_low: 50,
    optimal_high: 150,
    normal_low: 15,
    normal_high: 300,
    min_plausible: 1,
    max_plausible: 5000,
    display_order: 4,
    tags: ['ferritin', 'iron', 'anaemia', 'nutritional', 'stores'],
  },
  {
    category: 'nutritional',
    name: 'Serum Iron',
    slug: 'serum-iron',
    unit: 'µg/dL',
    description:
      'This measures the amount of iron currently circulating in your blood. It varies through the day and with recent meals. On its own it can be misleading, so it is read with ferritin and TIBC. It contributes to the full iron picture.',
    why_it_matters:
      'Serum iron helps distinguish between different causes of anaemia and detects iron overload. Combined with ferritin and TIBC, it builds a complete map of your iron status.',
    what_affects_it:
      'Recent iron-rich meals or supplements raise it, while blood loss and chronic disease lower it. It naturally fluctuates through the day, so timing of the test affects the result.',
    optimal_low: 70,
    optimal_high: 150,
    normal_low: 50,
    normal_high: 170,
    min_plausible: 10,
    max_plausible: 500,
    display_order: 5,
    tags: ['iron', 'serum', 'anaemia', 'nutritional', 'transport'],
  },
  {
    category: 'nutritional',
    name: 'TIBC',
    slug: 'tibc',
    unit: 'µg/dL',
    description:
      'Total iron-binding capacity measures how much iron your blood could carry if fully loaded. It reflects the amount of the iron-transport protein available. A high capacity usually means the body is hungry for iron. It is interpreted together with serum iron and ferritin.',
    why_it_matters:
      'A high TIBC typically points to iron deficiency, while a low TIBC can indicate inflammation or iron overload. It is essential context for correctly interpreting other iron tests.',
    what_affects_it:
      'Iron deficiency raises it as the body tries to capture more iron, while chronic disease and malnutrition lower it. Pregnancy and oral estrogen can also increase it.',
    optimal_low: 250,
    optimal_high: 380,
    normal_low: 240,
    normal_high: 450,
    min_plausible: 100,
    max_plausible: 700,
    display_order: 6,
    tags: ['tibc', 'iron', 'binding', 'nutritional', 'transport'],
  },
  {
    category: 'nutritional',
    name: 'Zinc',
    slug: 'zinc',
    unit: 'µg/dL',
    description:
      'Zinc is a mineral involved in immunity, wound healing, taste, smell and hormone production. The body cannot store much of it, so a steady intake is needed. Deficiency is common and often subtle. It supports a wide range of everyday functions.',
    why_it_matters:
      'Low zinc weakens immunity, slows healing and can reduce testosterone and fertility. Adequate zinc supports immune defence, skin health and hormonal balance.',
    what_affects_it:
      'A diet low in meat and seafood, gut absorption problems and high intake of certain grains lower it. Infections and stress can temporarily reduce blood levels.',
    optimal_low: 90,
    optimal_high: 130,
    normal_low: 70,
    normal_high: 150,
    min_plausible: 20,
    max_plausible: 400,
    display_order: 7,
    tags: ['zinc', 'mineral', 'immunity', 'nutritional', 'healing'],
  },
  {
    category: 'nutritional',
    name: 'Magnesium',
    slug: 'magnesium',
    unit: 'mg/dL',
    description:
      'Magnesium is a mineral involved in hundreds of body processes, including muscle and nerve function, blood sugar control and sleep. Most of it is stored inside cells and bone. Blood tests show only a small fraction, so deficiency is easy to miss. It is vital yet commonly low.',
    why_it_matters:
      'Low magnesium contributes to muscle cramps, poor sleep, anxiety, irregular heartbeat and insulin resistance. Adequate levels support relaxation, metabolic health and a steady heartbeat.',
    what_affects_it:
      'A diet low in greens, nuts and whole grains, alcohol, stress and certain medications deplete it. Because blood reflects only a small pool, levels can look normal despite a real deficiency.',
    optimal_low: 2.0,
    optimal_high: 2.4,
    normal_low: 1.7,
    normal_high: 2.5,
    min_plausible: 0.5,
    max_plausible: 6,
    display_order: 8,
    tags: ['magnesium', 'mineral', 'muscle', 'nutritional', 'sleep'],
  },
  {
    category: 'nutritional',
    name: 'Selenium',
    slug: 'selenium',
    unit: 'µg/L',
    description:
      'Selenium is a trace mineral that supports thyroid function and acts as an antioxidant. The body needs only tiny amounts. Levels depend heavily on the selenium content of local soil and food. It plays a quiet but important protective role.',
    why_it_matters:
      'Selenium is essential for converting thyroid hormone into its active form and for defending cells against oxidative damage. Both deficiency and excess can harm health, so balance matters.',
    what_affects_it:
      'Soil selenium levels, diet, and supplementation determine it, with Brazil nuts and seafood being rich sources. Excess supplementation can cause toxicity, so intake should be moderate.',
    optimal_low: 110,
    optimal_high: 150,
    normal_low: 70,
    normal_high: 150,
    min_plausible: 20,
    max_plausible: 800,
    display_order: 9,
    tags: ['selenium', 'mineral', 'antioxidant', 'nutritional', 'thyroid'],
  },
  {
    category: 'nutritional',
    name: 'Vitamin A',
    slug: 'vitamin-a',
    unit: 'µg/dL',
    description:
      'Vitamin A is essential for vision, immunity and healthy skin. It comes from animal foods and from colourful plant pigments your body converts. Both deficiency and excess can cause problems. It supports your eyes, skin and immune system.',
    why_it_matters:
      'Vitamin A deficiency impairs night vision and weakens immunity, while excess can be toxic to the liver and bones. Maintaining a balanced level protects eyesight and immune health.',
    what_affects_it:
      'Diet, fat absorption and supplementation determine it, since vitamin A is fat-soluble. Liver disease and very high supplement doses can push levels too high.',
    optimal_low: 40,
    optimal_high: 65,
    normal_low: 30,
    normal_high: 80,
    min_plausible: 5,
    max_plausible: 300,
    display_order: 10,
    tags: ['vitamin-a', 'vision', 'immunity', 'nutritional', 'skin'],
  },
  {
    category: 'nutritional',
    name: 'Vitamin E',
    slug: 'vitamin-e',
    unit: 'mg/L',
    description:
      'Vitamin E is a fat-soluble antioxidant that protects cell membranes from damage. It is found in nuts, seeds and vegetable oils. It works to neutralise harmful molecules in the body. It supports skin, nerve and immune health.',
    why_it_matters:
      'Adequate vitamin E protects cells from oxidative stress and supports nerve and immune function. Deficiency is rare but can cause nerve problems, while very high doses may interfere with clotting.',
    what_affects_it:
      'Diet, fat absorption and supplementation determine it. Conditions that impair fat absorption can lower it, and high-dose supplements raise it.',
    optimal_low: 8,
    optimal_high: 18,
    normal_low: 5.5,
    normal_high: 18,
    min_plausible: 1,
    max_plausible: 80,
    display_order: 11,
    tags: ['vitamin-e', 'antioxidant', 'nutritional', 'cells', 'fat-soluble'],
  },
  {
    category: 'nutritional',
    name: 'Omega-3 Index',
    slug: 'omega-3-index',
    unit: '%',
    description:
      'This measures the percentage of beneficial omega-3 fats in your red blood cell membranes. It reflects your long-term intake of fish and omega-3 sources. A higher index indicates better cellular and heart health. It is a stable, meaningful nutrition marker.',
    why_it_matters:
      'A higher omega-3 index is associated with lower heart-disease risk, reduced inflammation and better brain health. A low index signals a diet poor in the fats your body needs.',
    what_affects_it:
      'Fatty fish intake and omega-3 supplements raise it, while diets high in processed foods and low in fish keep it low. It changes slowly over months, reflecting sustained habits.',
    optimal_low: 8,
    optimal_high: 12,
    normal_low: 4,
    normal_high: 12,
    min_plausible: 1,
    max_plausible: 20,
    display_order: 12,
    tags: ['omega-3', 'fats', 'nutritional', 'heart', 'inflammation'],
  },
  {
    category: 'nutritional',
    name: 'Copper',
    slug: 'copper',
    unit: 'µg/dL',
    description:
      'Copper is a trace mineral needed to make red blood cells, connective tissue and energy. It works in balance with zinc. The body needs only small amounts. Both too little and too much cause problems.',
    why_it_matters:
      'Copper deficiency can cause anaemia and nerve problems, while excess is toxic and linked to liver damage. Keeping copper in balance with zinc supports blood and tissue health.',
    what_affects_it:
      'Diet, high zinc supplementation and absorption problems affect it. Certain genetic conditions and liver disease can cause copper to accumulate to harmful levels.',
    optimal_low: 80,
    optimal_high: 130,
    normal_low: 70,
    normal_high: 175,
    min_plausible: 20,
    max_plausible: 500,
    display_order: 13,
    tags: ['copper', 'mineral', 'nutritional', 'trace', 'blood'],
  },
  {
    category: 'nutritional',
    name: 'Vitamin K1',
    slug: 'vitamin-k1',
    unit: 'ng/mL',
    description:
      'Vitamin K is essential for blood clotting and for directing calcium into bones rather than arteries. It is found mostly in leafy green vegetables. Without it, wounds would not clot properly. It quietly supports both bones and blood vessels.',
    why_it_matters:
      'Adequate vitamin K ensures proper blood clotting and helps keep calcium in bones instead of artery walls. Low levels are linked to easier bleeding and poorer bone health.',
    what_affects_it:
      'A diet low in leafy greens, fat-absorption problems and blood-thinning medications reduce it. Antibiotics can lower it by affecting gut bacteria that help produce it.',
    optimal_low: 0.5,
    optimal_high: 2.5,
    normal_low: 0.2,
    normal_high: 3.2,
    min_plausible: 0.05,
    max_plausible: 10,
    display_order: 14,
    tags: ['vitamin-k', 'clotting', 'bone', 'nutritional', 'fat-soluble'],
  },

  // ───────────────────────── INFLAMMATORY ─────────────────────────
  {
    category: 'inflammatory',
    name: 'hsCRP (Inflammation)',
    slug: 'hscrp-inflammation',
    unit: 'mg/L',
    description:
      'This high-sensitivity C-reactive protein test detects low levels of a substance the liver makes in response to inflammation. As a general inflammation marker it shows how much hidden inflammation is present in your body. Chronic low-grade inflammation accelerates ageing and disease. It is the most widely used inflammation test.',
    why_it_matters:
      'Persistently elevated hsCRP is tied to faster ageing and higher risk of heart disease, diabetes and many chronic conditions. Tracking it helps you measure whether anti-inflammatory lifestyle changes are working.',
    what_affects_it:
      'Obesity, smoking, poor diet, stress and infections raise it, while exercise, weight loss and an anti-inflammatory diet lower it. A recent cold or injury can temporarily spike it.',
    optimal_low: 0,
    optimal_high: 1.0,
    normal_low: 0,
    normal_high: 3.0,
    min_plausible: 0,
    max_plausible: 100,
    display_order: 1,
    tags: ['hscrp', 'inflammation', 'crp', 'chronic', 'ageing'],
  },
  {
    category: 'inflammatory',
    name: 'ESR',
    slug: 'esr',
    unit: 'mm/hr',
    description:
      'This test measures how quickly red blood cells settle to the bottom of a tube in one hour. They settle faster when inflammation is present. It is an old but useful general marker of inflammation. It is often paired with CRP.',
    why_it_matters:
      'A high ESR signals inflammation somewhere in the body and helps detect and monitor conditions like infections and autoimmune disease. It is a simple, broad screen that prompts further investigation.',
    what_affects_it:
      'Infections, autoimmune disease, anaemia and pregnancy raise it, and it rises naturally with age and is higher in women. Some conditions lower it, so context is needed.',
    optimal_low: 0,
    optimal_high: 10,
    normal_low: 0,
    normal_high: 20,
    min_plausible: 0,
    max_plausible: 150,
    display_order: 2,
    tags: ['esr', 'inflammation', 'sedimentation', 'autoimmune', 'screening'],
  },
  {
    category: 'inflammatory',
    name: 'IL-6',
    slug: 'il-6',
    unit: 'pg/mL',
    description:
      'Interleukin-6 is a signalling molecule the immune system releases to coordinate inflammation. It is one of the messengers that drives the body’s inflammatory response. Elevated levels indicate active or chronic inflammation. It is a more specific inflammation marker than CRP.',
    why_it_matters:
      'High IL-6 is linked to chronic inflammation, heart disease, frailty and accelerated ageing. It is one of the upstream drivers that triggers other inflammation markers like CRP.',
    what_affects_it:
      'Obesity, infection, intense exercise, stress and chronic disease raise it, while fitness and weight loss lower it. Levels rise sharply during acute illness and injury.',
    optimal_low: 0,
    optimal_high: 1.8,
    normal_low: 0,
    normal_high: 4,
    min_plausible: 0,
    max_plausible: 1000,
    display_order: 3,
    tags: ['il-6', 'interleukin', 'inflammation', 'cytokine', 'immune'],
  },
  {
    category: 'inflammatory',
    name: 'TNF-alpha',
    slug: 'tnf-alpha',
    unit: 'pg/mL',
    description:
      'Tumour necrosis factor alpha is a powerful inflammatory messenger released by immune cells. It plays a central role in driving inflammation throughout the body. Chronically high levels are seen in many inflammatory diseases. It is a key target of several modern medications.',
    why_it_matters:
      'Elevated TNF-alpha is involved in autoimmune diseases, insulin resistance and chronic inflammation. Reducing it is a major goal in treating conditions like rheumatoid arthritis.',
    what_affects_it:
      'Obesity, chronic disease, infection and stress raise it, while exercise and weight loss can lower it. Certain biologic medications are designed specifically to block it.',
    optimal_low: 0,
    optimal_high: 2.8,
    normal_low: 0,
    normal_high: 8.1,
    min_plausible: 0,
    max_plausible: 500,
    display_order: 4,
    tags: ['tnf', 'inflammation', 'cytokine', 'autoimmune', 'immune'],
  },
  {
    category: 'inflammatory',
    name: 'Fibrinogen (Inflammation)',
    slug: 'fibrinogen-inflammation',
    unit: 'mg/dL',
    description:
      'Beyond its role in clotting, fibrinogen rises whenever there is inflammation in the body. As an inflammation marker it reflects how much the liver is ramping up production. It serves as a broad signal of inflammatory activity. It is read alongside CRP and ESR.',
    why_it_matters:
      'High fibrinogen reflects chronic inflammation and is associated with higher risk of clots and cardiovascular disease. It adds another dimension to assessing your inflammatory burden.',
    what_affects_it:
      'Smoking, obesity, infection and inflammation raise it, while exercise and quitting smoking lower it. It increases naturally with age and during any acute illness.',
    optimal_low: 200,
    optimal_high: 350,
    normal_low: 200,
    normal_high: 400,
    min_plausible: 50,
    max_plausible: 1000,
    display_order: 5,
    tags: ['fibrinogen', 'inflammation', 'clotting', 'chronic', 'acute-phase'],
  },
  {
    category: 'inflammatory',
    name: 'Serum Albumin',
    slug: 'serum-albumin',
    unit: 'g/dL',
    description:
      'Albumin is the most abundant protein in your blood, made by the liver. It keeps fluid inside your vessels and carries many substances. It tends to fall during chronic inflammation and poor nutrition. It is a quiet marker of overall health and resilience.',
    why_it_matters:
      'Low albumin reflects chronic inflammation, poor nutrition or liver and kidney problems, and is linked to frailty and worse health outcomes. A healthy level signals good nutritional and inflammatory status.',
    what_affects_it:
      'Chronic inflammation, liver disease, kidney disease and malnutrition lower it, while good nutrition supports it. Dehydration can falsely raise the reading.',
    optimal_low: 4.2,
    optimal_high: 5.0,
    normal_low: 3.5,
    normal_high: 5.0,
    min_plausible: 1.0,
    max_plausible: 7.0,
    display_order: 6,
    tags: ['albumin', 'protein', 'inflammation', 'nutrition', 'liver'],
  },

  // ───────────────────────── THYROID ─────────────────────────
  {
    category: 'thyroid',
    name: 'TSH',
    slug: 'tsh',
    unit: 'µIU/mL',
    description:
      'Thyroid-stimulating hormone is the brain’s signal telling the thyroid gland how hard to work. When thyroid hormone is low, TSH rises to push the gland harder, and vice versa. It is the most sensitive first test of thyroid function. It is the cornerstone of thyroid screening.',
    why_it_matters:
      'An abnormal TSH is the earliest sign of an under- or over-active thyroid, conditions that affect energy, weight, mood and heart rate. Catching it early allows simple treatment before symptoms worsen.',
    what_affects_it:
      'Thyroid disease, pregnancy, certain medications and stress shift it, and it varies slightly through the day. Because it responds to thyroid hormone, it moves opposite to Free T4 and Free T3.',
    optimal_low: 1.0,
    optimal_high: 2.5,
    normal_low: 0.4,
    normal_high: 4.0,
    min_plausible: 0.01,
    max_plausible: 100,
    display_order: 1,
    tags: ['tsh', 'thyroid', 'pituitary', 'metabolism', 'screening'],
  },
  {
    category: 'thyroid',
    name: 'Free T4',
    slug: 'free-t4',
    unit: 'ng/dL',
    description:
      'This measures the unbound, active form of thyroxine, the main hormone the thyroid produces. T4 is a reserve hormone the body converts into the more active T3 as needed. The free portion is what is available to your tissues. It is a direct measure of thyroid output.',
    why_it_matters:
      'Free T4 confirms whether the thyroid is producing enough hormone and helps interpret an abnormal TSH. It is key to diagnosing both underactive and overactive thyroid conditions.',
    what_affects_it:
      'Thyroid disease, certain medications and pregnancy affect it, and severe illness can lower it. It is read together with TSH to pinpoint where a thyroid problem lies.',
    optimal_low: 1.0,
    optimal_high: 1.5,
    normal_low: 0.8,
    normal_high: 1.8,
    min_plausible: 0.1,
    max_plausible: 8,
    display_order: 2,
    tags: ['t4', 'thyroxine', 'thyroid', 'free', 'metabolism'],
  },
  {
    category: 'thyroid',
    name: 'Free T3',
    slug: 'free-t3',
    unit: 'pg/mL',
    description:
      'This measures the unbound, active form of triiodothyronine, the most powerful thyroid hormone. T3 does most of the actual work of regulating metabolism in your cells. The free portion is what your tissues can use. It reflects active thyroid effect at the cellular level.',
    why_it_matters:
      'Free T3 shows how much active thyroid hormone is reaching your cells, which determines energy, temperature and metabolic rate. It can reveal conversion problems that TSH and T4 alone would miss.',
    what_affects_it:
      'Stress, illness, calorie restriction and nutrient status affect the conversion of T4 into T3. Selenium and overall health support good conversion, while severe illness suppresses it.',
    optimal_low: 3.0,
    optimal_high: 4.0,
    normal_low: 2.3,
    normal_high: 4.2,
    min_plausible: 0.5,
    max_plausible: 20,
    display_order: 3,
    tags: ['t3', 'triiodothyronine', 'thyroid', 'free', 'metabolism'],
  },
  {
    category: 'thyroid',
    name: 'Total T4',
    slug: 'total-t4',
    unit: 'µg/dL',
    description:
      'This measures all of the thyroxine in your blood, both the bound and the free portions. Most T4 is carried bound to proteins. It gives an overall picture of thyroid hormone production. It is interpreted alongside the free measurements.',
    why_it_matters:
      'Total T4 helps assess overall thyroid hormone production and supports the diagnosis of thyroid disorders. It is especially useful when protein-binding levels are unusual.',
    what_affects_it:
      'Pregnancy, estrogen and certain medications change the binding proteins and shift total T4 without changing the free fraction. Thyroid disease itself is the main driver of true changes.',
    optimal_low: 6,
    optimal_high: 10,
    normal_low: 4.5,
    normal_high: 12,
    min_plausible: 1,
    max_plausible: 30,
    display_order: 4,
    tags: ['t4', 'total', 'thyroid', 'thyroxine', 'metabolism'],
  },
  {
    category: 'thyroid',
    name: 'Total T3',
    slug: 'total-t3',
    unit: 'ng/dL',
    description:
      'This measures all of the triiodothyronine in your blood, both bound and free. T3 is the most active thyroid hormone that drives metabolism. The total reading reflects overall T3 availability. It complements the free T3 measurement.',
    why_it_matters:
      'Total T3 is especially helpful in diagnosing an overactive thyroid, where it often rises before other markers. It rounds out the picture of how much active hormone the body has.',
    what_affects_it:
      'Pregnancy, estrogen and binding-protein changes shift it, while severe illness and starvation lower it. Thyroid disease is the main cause of genuine changes.',
    optimal_low: 90,
    optimal_high: 160,
    normal_low: 80,
    normal_high: 200,
    min_plausible: 20,
    max_plausible: 600,
    display_order: 5,
    tags: ['t3', 'total', 'thyroid', 'triiodothyronine', 'metabolism'],
  },
  {
    category: 'thyroid',
    name: 'Anti-TPO Antibodies',
    slug: 'anti-tpo',
    unit: 'IU/mL',
    description:
      'These are antibodies that mistakenly attack an enzyme inside the thyroid gland. Their presence shows the immune system is targeting the thyroid. They are the hallmark of autoimmune thyroid disease. They can appear long before thyroid hormone levels change.',
    why_it_matters:
      'High anti-TPO antibodies indicate autoimmune thyroid disease such as Hashimoto’s, the most common cause of an underactive thyroid. Detecting them early flags people who need ongoing thyroid monitoring.',
    what_affects_it:
      'They are driven by autoimmune activity rather than lifestyle, though they are more common in women and tend to rise around pregnancy. Selenium status and overall immune health may influence them modestly.',
    optimal_low: 0,
    optimal_high: 9,
    normal_low: 0,
    normal_high: 34,
    min_plausible: 0,
    max_plausible: 5000,
    display_order: 6,
    tags: ['anti-tpo', 'thyroid', 'autoimmune', 'antibodies', 'hashimoto'],
  },

  // ───────────────────────── HEPATIC (LIVER & KIDNEY) ─────────────────────────
  {
    category: 'hepatic',
    name: 'ALT',
    slug: 'alt',
    unit: 'U/L',
    description:
      'ALT is an enzyme found mostly inside liver cells. When liver cells are damaged, ALT leaks into the blood. A high level is a sensitive sign of liver injury. It is one of the main liver-function tests.',
    why_it_matters:
      'Elevated ALT is an early warning of liver damage from fatty liver, alcohol, viruses or medications. Because fatty liver is increasingly common, this marker is important for metabolic health too.',
    what_affects_it:
      'Fatty liver, alcohol, obesity, certain medications and viral hepatitis raise it. Weight loss and reducing alcohol typically lower it, and it tends to track with metabolic health.',
    optimal_low: 10,
    optimal_high: 25,
    normal_low: 7,
    normal_high: 40,
    min_plausible: 2,
    max_plausible: 5000,
    display_order: 1,
    tags: ['alt', 'liver', 'enzyme', 'hepatic', 'fatty-liver'],
  },
  {
    category: 'hepatic',
    name: 'AST',
    slug: 'ast',
    unit: 'U/L',
    description:
      'AST is an enzyme found in the liver but also in muscle and the heart. When these tissues are damaged, AST rises in the blood. It is less specific to the liver than ALT. The two are usually read together.',
    why_it_matters:
      'AST helps assess liver damage, and its ratio to ALT can hint at the cause, such as alcohol-related injury. Because it also comes from muscle, it adds context when interpreting liver tests.',
    what_affects_it:
      'Liver disease, alcohol, muscle injury and intense exercise raise it. The pattern of AST relative to ALT helps distinguish among different causes of liver stress.',
    optimal_low: 10,
    optimal_high: 25,
    normal_low: 8,
    normal_high: 40,
    min_plausible: 2,
    max_plausible: 5000,
    display_order: 2,
    tags: ['ast', 'liver', 'enzyme', 'hepatic', 'muscle'],
  },
  {
    category: 'hepatic',
    name: 'GGT',
    slug: 'ggt',
    unit: 'U/L',
    description:
      'GGT is an enzyme found in the liver and bile ducts. It is particularly sensitive to alcohol and bile-flow problems. A high level often points to alcohol use or blockage in the bile system. It complements the other liver enzymes.',
    why_it_matters:
      'High GGT is a sensitive marker of alcohol-related liver stress and bile-duct problems, and it also reflects oxidative stress. It helps clarify the cause when other liver enzymes are elevated.',
    what_affects_it:
      'Alcohol is the biggest driver, along with fatty liver, certain medications and bile-duct obstruction. Reducing alcohol typically lowers it within weeks.',
    optimal_low: 10,
    optimal_high: 30,
    normal_low: 8,
    normal_high: 55,
    min_plausible: 2,
    max_plausible: 3000,
    display_order: 3,
    tags: ['ggt', 'liver', 'enzyme', 'hepatic', 'alcohol'],
  },
  {
    category: 'hepatic',
    name: 'ALP',
    slug: 'alp',
    unit: 'U/L',
    description:
      'Alkaline phosphatase is an enzyme found in the liver, bile ducts and bones. A high level can come from either liver or bone problems. Its source is sorted out using other tests. It is a standard part of the liver panel.',
    why_it_matters:
      'Elevated ALP can signal bile-duct blockage, liver disease or bone disorders, prompting further investigation. It widens the liver panel to also catch certain bone conditions.',
    what_affects_it:
      'Bile-duct obstruction, liver disease, bone growth and pregnancy raise it. It is naturally higher in growing children and during healing of bone.',
    optimal_low: 45,
    optimal_high: 100,
    normal_low: 40,
    normal_high: 129,
    min_plausible: 10,
    max_plausible: 2000,
    display_order: 4,
    tags: ['alp', 'liver', 'enzyme', 'hepatic', 'bone'],
  },
  {
    category: 'hepatic',
    name: 'Total Bilirubin',
    slug: 'total-bilirubin',
    unit: 'mg/dL',
    description:
      'Bilirubin is a yellow pigment made when old red blood cells break down. The liver processes it and removes it through bile. When it builds up, the skin and eyes turn yellow. This test measures the total amount in the blood.',
    why_it_matters:
      'High bilirubin can indicate liver disease, bile-duct blockage or excessive red-cell breakdown. It is the substance responsible for jaundice and a key marker of liver clearance.',
    what_affects_it:
      'Liver disease, bile-duct obstruction and conditions that destroy red cells raise it. A common harmless genetic variant called Gilbert’s syndrome causes mild fluctuating elevations.',
    optimal_low: 0.3,
    optimal_high: 1.0,
    normal_low: 0.1,
    normal_high: 1.2,
    min_plausible: 0.05,
    max_plausible: 50,
    display_order: 5,
    tags: ['bilirubin', 'liver', 'jaundice', 'hepatic', 'bile'],
  },
  {
    category: 'hepatic',
    name: 'Direct Bilirubin',
    slug: 'direct-bilirubin',
    unit: 'mg/dL',
    description:
      'This measures the portion of bilirubin that the liver has already processed and made water-soluble. A high direct level points specifically to problems with the liver or bile flow. It separates liver and bile issues from red-cell breakdown. It refines the total bilirubin result.',
    why_it_matters:
      'A high direct bilirubin specifically points to bile-flow obstruction or liver-cell damage. It helps pinpoint the cause of jaundice more precisely than total bilirubin alone.',
    what_affects_it:
      'Bile-duct blockage, gallstones and liver disease raise it. It is interpreted alongside total bilirubin to determine where the problem lies.',
    optimal_low: 0,
    optimal_high: 0.2,
    normal_low: 0,
    normal_high: 0.3,
    min_plausible: 0,
    max_plausible: 30,
    display_order: 6,
    tags: ['bilirubin', 'direct', 'liver', 'hepatic', 'bile'],
  },
  {
    category: 'hepatic',
    name: 'Total Protein',
    slug: 'total-protein',
    unit: 'g/dL',
    description:
      'This measures all the protein in your blood, mainly albumin and antibodies. Proteins maintain fluid balance, fight infection and transport substances. The level reflects nutrition, liver function and immune activity. It is a broad health marker.',
    why_it_matters:
      'Abnormal total protein can indicate liver disease, kidney problems, poor nutrition or immune disorders. It gives a wide-angle view of several body systems at once.',
    what_affects_it:
      'Nutrition, hydration, liver and kidney function and immune activity all affect it. Dehydration raises it while malnutrition and liver disease lower it.',
    optimal_low: 6.5,
    optimal_high: 8.0,
    normal_low: 6.0,
    normal_high: 8.3,
    min_plausible: 3,
    max_plausible: 12,
    display_order: 7,
    tags: ['protein', 'liver', 'nutrition', 'hepatic', 'albumin'],
  },
  {
    category: 'hepatic',
    name: 'Creatinine',
    slug: 'creatinine',
    unit: 'mg/dL',
    description:
      'Creatinine is a waste product from normal muscle activity that your kidneys filter out. When the kidneys slow down, it builds up in the blood. It is the most common blood test of kidney function. It is used to estimate filtration rate.',
    why_it_matters:
      'Rising creatinine is a key sign of declining kidney function, which can be silent until advanced. Monitoring it helps catch kidney disease early and adjust medication doses safely.',
    what_affects_it:
      'Muscle mass, hydration, protein intake and kidney health affect it, so muscular people naturally run higher. Dehydration and certain medications can raise it temporarily.',
    optimal_low: 0.7,
    optimal_high: 1.1,
    normal_low: 0.6,
    normal_high: 1.3,
    min_plausible: 0.2,
    max_plausible: 20,
    display_order: 8,
    tags: ['creatinine', 'kidney', 'filtration', 'hepatic', 'waste'],
  },
  {
    category: 'hepatic',
    name: 'eGFR',
    slug: 'egfr',
    unit: 'mL/min/1.73m²',
    description:
      'This is a calculated estimate of how much blood your kidneys filter each minute. It is derived mainly from your creatinine, age and sex. A higher number means better kidney function. It is the standard way to stage kidney health.',
    why_it_matters:
      'eGFR is the primary number used to detect and stage chronic kidney disease. A declining value signals failing kidneys long before symptoms appear, allowing earlier intervention.',
    what_affects_it:
      'It falls with age, kidney disease, diabetes and high blood pressure, and is influenced by muscle mass since it depends on creatinine. Hydration and acute illness can cause temporary changes.',
    optimal_low: 90,
    optimal_high: 120,
    normal_low: 60,
    normal_high: 120,
    min_plausible: 5,
    max_plausible: 160,
    display_order: 9,
    tags: ['egfr', 'kidney', 'filtration', 'hepatic', 'function'],
  },
  {
    category: 'hepatic',
    name: 'BUN',
    slug: 'bun',
    unit: 'mg/dL',
    description:
      'Blood urea nitrogen measures a waste product made when the body breaks down protein. The kidneys normally remove it from the blood. A high level can reflect kidney problems or dehydration. It is read together with creatinine.',
    why_it_matters:
      'BUN helps assess kidney function and hydration status, and its ratio to creatinine offers clues about the cause of kidney stress. It complements creatinine for a fuller kidney picture.',
    what_affects_it:
      'Dehydration, a high-protein diet, bleeding in the gut and kidney disease raise it, while low protein intake and overhydration lower it. Certain medications also influence it.',
    optimal_low: 8,
    optimal_high: 18,
    normal_low: 7,
    normal_high: 20,
    min_plausible: 2,
    max_plausible: 200,
    display_order: 10,
    tags: ['bun', 'urea', 'kidney', 'hepatic', 'waste'],
  },
  {
    category: 'hepatic',
    name: 'Uric Acid (Renal)',
    slug: 'uric-acid-renal',
    unit: 'mg/dL',
    description:
      'This measures uric acid from the perspective of kidney clearance, since the kidneys are responsible for removing it. When the kidneys slow down, uric acid can accumulate. It links kidney function to gout risk. It rounds out the kidney panel.',
    why_it_matters:
      'High uric acid stresses the kidneys, can form kidney stones and is associated with reduced kidney function. Monitoring it supports both kidney and metabolic health.',
    what_affects_it:
      'Reduced kidney function, dehydration, a purine-rich diet and alcohol raise it. Good hydration and certain medications help lower it.',
    optimal_low: 3.5,
    optimal_high: 5.5,
    normal_low: 2.5,
    normal_high: 7.0,
    min_plausible: 0.5,
    max_plausible: 20,
    display_order: 11,
    tags: ['uric-acid', 'kidney', 'renal', 'hepatic', 'gout'],
  },

  // ───────────────────────── BLOOD (CBC) ─────────────────────────
  {
    category: 'blood',
    name: 'WBC (White Blood Cells)',
    slug: 'wbc',
    unit: '10^3/µL',
    description:
      'This counts the total number of white blood cells, your body’s infection-fighting army. They rise to defend against infection and fall when the immune system is suppressed. The count is a quick snapshot of immune activity. It is a core part of the blood count.',
    why_it_matters:
      'A high white-cell count often signals infection or inflammation, while a low count can mean a weakened immune system or bone-marrow problems. It is a frontline check of immune health.',
    what_affects_it:
      'Infections, inflammation, stress, exercise and smoking raise it, while certain medications and bone-marrow disorders lower it. Recent illness can temporarily skew the count.',
    optimal_low: 4.5,
    optimal_high: 7.5,
    normal_low: 4.0,
    normal_high: 11.0,
    min_plausible: 0.5,
    max_plausible: 100,
    display_order: 1,
    tags: ['wbc', 'immune', 'blood', 'infection', 'cbc'],
  },
  {
    category: 'blood',
    name: 'RBC (Red Blood Cells)',
    slug: 'rbc',
    unit: '10^6/µL',
    description:
      'This counts the number of red blood cells, which carry oxygen from your lungs to the rest of your body. Too few cause anaemia and fatigue, while too many can thicken the blood. The count reflects your oxygen-carrying capacity. It is a foundational blood measure.',
    why_it_matters:
      'A low red-cell count points to anaemia and its fatigue, while a high count can indicate dehydration or other conditions that thicken the blood. It anchors the diagnosis of many blood disorders.',
    what_affects_it:
      'Iron, B12 and folate status, hydration, altitude and bone-marrow health all affect it. Blood loss and chronic disease lower it, while dehydration falsely raises it.',
    optimal_low: 4.5,
    optimal_high: 5.5,
    normal_low: 4.0,
    normal_high: 6.0,
    min_plausible: 1.5,
    max_plausible: 9,
    display_order: 2,
    tags: ['rbc', 'oxygen', 'blood', 'anaemia', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Hemoglobin',
    slug: 'hemoglobin',
    unit: 'g/dL',
    description:
      'Hemoglobin is the iron-rich protein inside red blood cells that actually carries oxygen. This is the single most important test for anaemia. Low levels mean your blood carries less oxygen. It directly relates to energy and stamina.',
    why_it_matters:
      'Low hemoglobin is the defining feature of anaemia, causing fatigue, breathlessness and pallor. It is one of the most clinically important everyday blood numbers.',
    what_affects_it:
      'Iron, B12 and folate status, blood loss, hydration and chronic disease all affect it. Heavy periods and poor iron intake are common causes of low levels in women.',
    optimal_low: 13.5,
    optimal_high: 16.0,
    normal_low: 12.0,
    normal_high: 17.5,
    min_plausible: 3,
    max_plausible: 25,
    display_order: 3,
    tags: ['hemoglobin', 'iron', 'oxygen', 'anaemia', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Hematocrit',
    slug: 'hematocrit',
    unit: '%',
    description:
      'This is the percentage of your blood volume made up of red blood cells. It moves closely with hemoglobin and the red-cell count. A high value can mean dehydration, while a low one suggests anaemia. It is a standard blood-count measure.',
    why_it_matters:
      'Hematocrit helps confirm anaemia or detect blood that is too thick, complementing the hemoglobin result. It is useful for spotting dehydration and certain blood disorders.',
    what_affects_it:
      'Hydration, iron status, altitude and blood loss affect it. Dehydration raises it artificially, while bleeding and chronic disease lower it.',
    optimal_low: 40,
    optimal_high: 48,
    normal_low: 36,
    normal_high: 52,
    min_plausible: 10,
    max_plausible: 70,
    display_order: 4,
    tags: ['hematocrit', 'blood', 'red-cells', 'anaemia', 'cbc'],
  },
  {
    category: 'blood',
    name: 'MCV (Mean Corpuscular Volume)',
    slug: 'mcv',
    unit: 'fL',
    description:
      'This measures the average size of your red blood cells. It helps classify the type of anaemia a person has. Small cells suggest iron deficiency, while large cells suggest B12 or folate deficiency. It is a key clue for diagnosis.',
    why_it_matters:
      'MCV narrows down the cause of anaemia, distinguishing iron deficiency from vitamin deficiencies. This guides which further tests and treatments are needed.',
    what_affects_it:
      'Iron deficiency makes cells smaller, while B12 and folate deficiency and alcohol make them larger. Certain inherited conditions also alter cell size.',
    optimal_low: 85,
    optimal_high: 92,
    normal_low: 80,
    normal_high: 100,
    min_plausible: 50,
    max_plausible: 140,
    display_order: 5,
    tags: ['mcv', 'red-cells', 'anaemia', 'blood', 'cbc'],
  },
  {
    category: 'blood',
    name: 'MCH (Mean Corpuscular Hemoglobin)',
    slug: 'mch',
    unit: 'pg',
    description:
      'This measures the average amount of hemoglobin packed into each red blood cell. It works alongside MCV to characterise anaemia. A low value means cells carry less oxygen-binding protein. It adds detail to the blood count.',
    why_it_matters:
      'MCH helps classify anaemia and supports the interpretation of MCV. Together they point toward the underlying cause of abnormal red cells.',
    what_affects_it:
      'Iron deficiency lowers it, while B12 and folate deficiency tend to raise it. It moves in parallel with MCV in most situations.',
    optimal_low: 28,
    optimal_high: 32,
    normal_low: 27,
    normal_high: 33,
    min_plausible: 15,
    max_plausible: 45,
    display_order: 6,
    tags: ['mch', 'hemoglobin', 'red-cells', 'blood', 'cbc'],
  },
  {
    category: 'blood',
    name: 'MCHC (Mean Corpuscular Hemoglobin Concentration)',
    slug: 'mchc',
    unit: 'g/dL',
    description:
      'This measures the concentration of hemoglobin within a given volume of red cells. It indicates how densely the cells are packed with oxygen-carrying protein. A low value suggests pale, under-filled cells. It is part of the standard red-cell indices.',
    why_it_matters:
      'MCHC helps refine the classification of anaemia and can flag specific red-cell disorders. It completes the trio of red-cell indices used in diagnosis.',
    what_affects_it:
      'Iron deficiency lowers it, while certain inherited conditions can raise it. Lab handling of the sample can occasionally distort the value.',
    optimal_low: 32,
    optimal_high: 35,
    normal_low: 31.5,
    normal_high: 36,
    min_plausible: 25,
    max_plausible: 40,
    display_order: 7,
    tags: ['mchc', 'hemoglobin', 'red-cells', 'blood', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Platelets',
    slug: 'platelets',
    unit: '10^3/µL',
    description:
      'Platelets are tiny cell fragments that help your blood clot and stop bleeding. This counts how many are in your blood. Too few raise the risk of bleeding, while too many raise the risk of clots. It is a core blood-count value.',
    why_it_matters:
      'An abnormal platelet count can signal bleeding disorders, clotting risk, infection or bone-marrow problems. It is essential for assessing bleeding and clotting safety.',
    what_affects_it:
      'Infections, inflammation, iron deficiency and bone-marrow disorders raise it, while certain medications and conditions lower it. It can rise temporarily after illness or surgery.',
    optimal_low: 200,
    optimal_high: 350,
    normal_low: 150,
    normal_high: 410,
    min_plausible: 10,
    max_plausible: 1500,
    display_order: 8,
    tags: ['platelets', 'clotting', 'blood', 'bleeding', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Neutrophils',
    slug: 'neutrophils',
    unit: '%',
    description:
      'Neutrophils are the most common type of white blood cell and the first responders to bacterial infection. This shows what percentage of your white cells are neutrophils. They surge during acute infections. They are a key part of the differential count.',
    why_it_matters:
      'A high neutrophil percentage usually points to a bacterial infection or inflammation, while a low one increases infection risk. It helps identify the kind of immune challenge present.',
    what_affects_it:
      'Bacterial infections, stress, smoking and certain medications raise it, while some viral infections and bone-marrow problems lower it. Recent exercise can temporarily increase it.',
    optimal_low: 45,
    optimal_high: 65,
    normal_low: 40,
    normal_high: 70,
    min_plausible: 5,
    max_plausible: 95,
    display_order: 9,
    tags: ['neutrophils', 'immune', 'blood', 'infection', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Lymphocytes',
    slug: 'lymphocytes',
    unit: '%',
    description:
      'Lymphocytes are white blood cells that handle viral infections and long-term immunity. This shows what percentage of your white cells are lymphocytes. They rise during viral illness and reflect immune memory. They are part of the differential count.',
    why_it_matters:
      'A high lymphocyte percentage often indicates a viral infection, while a low one can reflect stress, steroids or immune suppression. It helps distinguish viral from bacterial illness.',
    what_affects_it:
      'Viral infections raise it, while stress, steroids and certain illnesses lower it. The balance between lymphocytes and neutrophils gives clues about the type of infection.',
    optimal_low: 25,
    optimal_high: 40,
    normal_low: 20,
    normal_high: 45,
    min_plausible: 2,
    max_plausible: 90,
    display_order: 10,
    tags: ['lymphocytes', 'immune', 'blood', 'viral', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Monocytes',
    slug: 'monocytes',
    unit: '%',
    description:
      'Monocytes are white blood cells that clean up damaged cells and fight certain infections. This shows what percentage of your white cells are monocytes. They become larger scavenger cells when they enter tissues. They are part of the differential count.',
    why_it_matters:
      'A high monocyte percentage can indicate chronic infection, inflammation or recovery from illness. It adds detail to the overall immune picture.',
    what_affects_it:
      'Chronic infections, inflammation and certain blood disorders raise it. It often rises during the recovery phase after an acute infection.',
    optimal_low: 3,
    optimal_high: 7,
    normal_low: 2,
    normal_high: 10,
    min_plausible: 0,
    max_plausible: 40,
    display_order: 11,
    tags: ['monocytes', 'immune', 'blood', 'inflammation', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Eosinophils',
    slug: 'eosinophils',
    unit: '%',
    description:
      'Eosinophils are white blood cells involved in allergic reactions and fighting parasites. This shows what percentage of your white cells are eosinophils. They rise during allergies and parasitic infections. They are part of the differential count.',
    why_it_matters:
      'A high eosinophil percentage often signals allergies, asthma or parasitic infection, which are common in some regions. It helps point toward allergic and parasitic causes of illness.',
    what_affects_it:
      'Allergies, asthma, parasitic infections and certain medications raise it, while steroids and acute stress lower it. Seasonal allergies can cause it to fluctuate.',
    optimal_low: 1,
    optimal_high: 3,
    normal_low: 0,
    normal_high: 6,
    min_plausible: 0,
    max_plausible: 60,
    display_order: 12,
    tags: ['eosinophils', 'allergy', 'blood', 'parasite', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Basophils',
    slug: 'basophils',
    unit: '%',
    description:
      'Basophils are the rarest type of white blood cell and play a role in allergic and inflammatory reactions. This shows what small percentage of your white cells are basophils. They release substances like histamine during reactions. They complete the differential count.',
    why_it_matters:
      'Although uncommon, a raised basophil count can occasionally indicate allergic conditions or certain blood disorders. It rounds out the white-cell differential.',
    what_affects_it:
      'Allergic reactions, chronic inflammation and some bone-marrow disorders can raise it. Levels are normally very low, so even small changes are noted.',
    optimal_low: 0,
    optimal_high: 1,
    normal_low: 0,
    normal_high: 2,
    min_plausible: 0,
    max_plausible: 5,
    display_order: 13,
    tags: ['basophils', 'allergy', 'blood', 'histamine', 'cbc'],
  },
  {
    category: 'blood',
    name: 'RDW (Red Cell Distribution Width)',
    slug: 'rdw',
    unit: '%',
    description:
      'This measures how much your red blood cells vary in size. A higher value means a wider mix of large and small cells. It is an early clue to certain anaemias. It adds nuance to the red-cell indices.',
    why_it_matters:
      'A high RDW can be one of the earliest signs of iron, B12 or folate deficiency, sometimes before other markers change. It also has links to overall health and inflammation.',
    what_affects_it:
      'Iron, B12 and folate deficiencies raise it, as does recent blood loss or a mix of different anaemias. It tends to rise when red-cell production is disrupted.',
    optimal_low: 11.5,
    optimal_high: 13.5,
    normal_low: 11.5,
    normal_high: 14.5,
    min_plausible: 8,
    max_plausible: 30,
    display_order: 14,
    tags: ['rdw', 'red-cells', 'anaemia', 'blood', 'cbc'],
  },
  {
    category: 'blood',
    name: 'Calcium',
    slug: 'calcium',
    unit: 'mg/dL',
    description:
      'Calcium is a mineral essential for bones, muscles, nerves and blood clotting. This measures the amount circulating in your blood, which the body keeps in a tight range. Most calcium is stored in bone, with only a small amount in the blood. It reflects mineral balance and parathyroid function.',
    why_it_matters:
      'Abnormal blood calcium can signal parathyroid, bone, kidney or vitamin D problems. Because the body guards this level so tightly, even small changes are clinically meaningful.',
    what_affects_it:
      'Vitamin D status, parathyroid hormone, kidney function and protein levels all affect it. Dehydration and certain medications can shift the reading.',
    optimal_low: 9.0,
    optimal_high: 10.0,
    normal_low: 8.6,
    normal_high: 10.3,
    min_plausible: 5,
    max_plausible: 16,
    display_order: 15,
    tags: ['calcium', 'mineral', 'bone', 'blood', 'parathyroid'],
  },
  {
    category: 'blood',
    name: 'Sodium',
    slug: 'sodium',
    unit: 'mmol/L',
    description:
      'Sodium is an electrolyte that controls the balance of fluid in and around your cells. This measures its concentration in the blood, which the body regulates closely. It is central to nerve and muscle function. It reflects hydration and fluid balance.',
    why_it_matters:
      'Abnormal sodium can cause confusion, weakness and serious neurological problems, and it points to fluid-balance or kidney issues. It is one of the most fundamental electrolytes to keep in range.',
    what_affects_it:
      'Hydration, kidney function, certain hormones and medications such as diuretics affect it. Excessive water intake or heavy fluid loss can shift it quickly.',
    optimal_low: 138,
    optimal_high: 142,
    normal_low: 135,
    normal_high: 145,
    min_plausible: 110,
    max_plausible: 170,
    display_order: 16,
    tags: ['sodium', 'electrolyte', 'blood', 'hydration', 'fluid'],
  },
  {
    category: 'blood',
    name: 'Potassium',
    slug: 'potassium',
    unit: 'mmol/L',
    description:
      'Potassium is an electrolyte vital for nerve signals and especially for a steady heartbeat. This measures its concentration in the blood, which is kept within a narrow range. Both high and low levels can be dangerous for the heart. It is a critical safety marker.',
    why_it_matters:
      'Abnormal potassium can cause dangerous heart-rhythm problems and muscle weakness. Because the heart is so sensitive to it, this level is one of the most safety-critical blood tests.',
    what_affects_it:
      'Kidney function, hydration, diet and many medications, including blood-pressure drugs, strongly affect it. Dehydration and kidney problems are common causes of high levels.',
    optimal_low: 4.0,
    optimal_high: 4.8,
    normal_low: 3.5,
    normal_high: 5.1,
    min_plausible: 2,
    max_plausible: 9,
    display_order: 17,
    tags: ['potassium', 'electrolyte', 'blood', 'heart', 'fluid'],
  },
  {
    category: 'blood',
    name: 'Phosphorus',
    slug: 'phosphorus',
    unit: 'mg/dL',
    description:
      'Phosphorus is a mineral that works with calcium to build bones and is part of how cells store energy. This measures the amount in your blood, which is balanced against calcium. The kidneys help regulate it. It reflects bone, kidney and metabolic health.',
    why_it_matters:
      'Abnormal phosphorus can indicate kidney disease, bone disorders or parathyroid problems. It must stay balanced with calcium for healthy bones and energy metabolism.',
    what_affects_it:
      'Kidney function, vitamin D, parathyroid hormone and diet affect it. Kidney disease commonly raises it, while certain deficiencies lower it.',
    optimal_low: 3.0,
    optimal_high: 4.0,
    normal_low: 2.5,
    normal_high: 4.5,
    min_plausible: 0.5,
    max_plausible: 12,
    display_order: 18,
    tags: ['phosphorus', 'mineral', 'bone', 'blood', 'kidney'],
  },
  {
    category: 'hepatic',
    name: 'Alkaline Phosphatase',
    slug: 'alkaline-phosphatase',
    unit: 'U/L',
    description:
      'Alkaline phosphatase (ALP) is an enzyme found mainly in the liver and bones. Blood levels rise when the bile ducts are blocked or when bone turnover is high.',
    why_it_matters:
      'ALP helps distinguish liver and bile-duct problems from bone conditions. Persistently high levels warrant a look at liver, gallbladder, or bone health.',
    what_affects_it:
      'Bile-duct obstruction, liver disease, bone growth or healing, pregnancy, and some medications raise it. Levels are naturally higher in growing children and adolescents.',
    optimal_low: 46,
    optimal_high: 100,
    normal_low: 46,
    normal_high: 116,
    min_plausible: 10,
    max_plausible: 1200,
    display_order: 19,
    tags: ['alp', 'alkaline phosphatase', 'liver', 'bone', 'hepatic'],
  },
  {
    category: 'hepatic',
    name: 'Indirect Bilirubin',
    slug: 'indirect-bilirubin',
    unit: 'mg/dL',
    description:
      'Indirect (unconjugated) bilirubin is the form of bilirubin before the liver processes it. It is calculated from total and direct bilirubin.',
    why_it_matters:
      'A high indirect fraction points to increased red-cell breakdown or inherited conditions like Gilbert syndrome, rather than a bile-flow problem.',
    what_affects_it:
      'Haemolysis, fasting, dehydration, and Gilbert syndrome raise it. It is usually harmless in isolation but is read alongside total and direct bilirubin.',
    optimal_low: 0,
    optimal_high: 0.7,
    normal_low: 0,
    normal_high: 0.9,
    min_plausible: 0,
    max_plausible: 20,
    display_order: 20,
    tags: ['indirect bilirubin', 'unconjugated', 'liver', 'haemolysis', 'hepatic'],
  },
  {
    category: 'hepatic',
    name: 'Blood Urea Nitrogen (BUN)',
    slug: 'blood-urea-nitrogen',
    unit: 'mg/dL',
    description:
      'BUN measures the nitrogen in your blood that comes from urea, a waste product of protein breakdown the kidneys filter out. It is a basic measure of kidney function and hydration. (BUN ≈ urea ÷ 2.14.)',
    why_it_matters:
      'High BUN can signal reduced kidney function or dehydration; low values can reflect low protein intake or liver issues. It is read alongside creatinine.',
    what_affects_it:
      'Hydration, dietary protein, kidney function, and some medications affect it. Dehydration and high-protein diets push it up; over-hydration lowers it.',
    optimal_low: 8,
    optimal_high: 18,
    normal_low: 9,
    normal_high: 23,
    min_plausible: 2,
    max_plausible: 200,
    display_order: 21,
    tags: ['bun', 'blood urea nitrogen', 'kidney', 'hepatic', 'waste'],
  },
  {
    category: 'hepatic',
    name: 'Serum Urea',
    slug: 'serum-urea',
    unit: 'mg/dL',
    description:
      'Urea is a waste product from protein breakdown that the kidneys filter out of the blood. Reported directly (not as nitrogen), it runs roughly 2.14× the BUN value.',
    why_it_matters:
      'High urea can signal reduced kidney function or dehydration, while low values can reflect low protein intake or liver issues. It is read alongside creatinine.',
    what_affects_it:
      'Hydration, dietary protein, kidney function, and some medications affect it. Dehydration and high-protein diets push it up; over-hydration lowers it.',
    optimal_low: 15,
    optimal_high: 40,
    normal_low: 19,
    normal_high: 49,
    min_plausible: 5,
    max_plausible: 300,
    display_order: 22,
    tags: ['urea', 'serum urea', 'kidney', 'hepatic', 'waste'],
  },
  {
    category: 'hormonal',
    name: 'PSA (Total)',
    slug: 'psa-total',
    unit: 'ng/mL',
    description:
      'Prostate-specific antigen (PSA) is a protein made by the prostate. Blood levels are used to screen for and monitor prostate conditions in men.',
    why_it_matters:
      'A rising or elevated PSA can be an early sign of prostate enlargement, inflammation, or cancer, prompting further evaluation.',
    what_affects_it:
      'Age, prostate size, recent ejaculation, cycling, infection, and some procedures can raise it. It is interpreted in the context of age and trend over time.',
    optimal_low: 0,
    optimal_high: 2.5,
    normal_low: 0,
    normal_high: 4,
    min_plausible: 0,
    max_plausible: 100,
    display_order: 19,
    tags: ['psa', 'prostate', 'hormonal', 'screening', 'men'],
  },
];
