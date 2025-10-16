-- Create yoga_poses table
CREATE TABLE public.yoga_poses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sanskrit_name TEXT,
  description TEXT NOT NULL,
  benefits TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  video_url TEXT,
  image_url TEXT,
  mood_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_points table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create pose_sessions table to track completed poses
CREATE TABLE public.pose_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pose_id UUID NOT NULL REFERENCES public.yoga_poses(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  accuracy_score NUMERIC(5,2),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yoga_poses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pose_sessions ENABLE ROW LEVEL SECURITY;

-- Yoga poses are public (everyone can view)
CREATE POLICY "Anyone can view yoga poses" ON public.yoga_poses FOR SELECT USING (true);

-- User points policies
CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);

-- Pose sessions policies
CREATE POLICY "Users can view own sessions" ON public.pose_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.pose_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert 50+ yoga poses with mood-based recommendations
INSERT INTO public.yoga_poses (name, sanskrit_name, description, benefits, difficulty, duration_seconds, mood_tags) VALUES
('Mountain Pose', 'Tadasana', 'Stand tall with feet together, arms at sides', 'Improves posture and balance', 'beginner', 30, ARRAY['calm', 'focused', 'energized']),
('Tree Pose', 'Vrksasana', 'Balance on one leg with other foot on inner thigh', 'Builds focus and balance', 'beginner', 45, ARRAY['calm', 'focused', 'peaceful']),
('Downward Dog', 'Adho Mukha Svanasana', 'Form an inverted V-shape with body', 'Stretches entire body, energizes', 'beginner', 60, ARRAY['energized', 'stressed', 'tired']),
('Child Pose', 'Balasana', 'Kneel and fold forward with arms extended', 'Relieves stress and fatigue', 'beginner', 90, ARRAY['stressed', 'anxious', 'tired']),
('Warrior I', 'Virabhadrasana I', 'Lunge with arms raised overhead', 'Builds strength and focus', 'beginner', 45, ARRAY['energized', 'confident', 'focused']),
('Warrior II', 'Virabhadrasana II', 'Wide stance with arms extended parallel', 'Increases stamina and concentration', 'beginner', 45, ARRAY['energized', 'confident', 'focused']),
('Triangle Pose', 'Trikonasana', 'Wide stance with one arm reaching to floor', 'Stretches sides and improves balance', 'beginner', 45, ARRAY['calm', 'focused', 'energized']),
('Cat-Cow Pose', 'Marjaryasana-Bitilasana', 'Flow between arched and rounded spine', 'Warms spine, relieves tension', 'beginner', 60, ARRAY['stressed', 'tired', 'anxious']),
('Cobra Pose', 'Bhujangasana', 'Lie on belly and lift chest with arms', 'Opens chest, strengthens spine', 'beginner', 30, ARRAY['sad', 'tired', 'low-energy']),
('Bridge Pose', 'Setu Bandha Sarvangasana', 'Lie on back and lift hips', 'Strengthens back, opens chest', 'beginner', 45, ARRAY['energized', 'anxious', 'stressed']),
('Corpse Pose', 'Savasana', 'Lie flat on back in complete relaxation', 'Deep relaxation and stress relief', 'beginner', 300, ARRAY['stressed', 'anxious', 'overwhelmed']),
('Seated Forward Bend', 'Paschimottanasana', 'Sit and fold forward over legs', 'Calms mind, stretches spine', 'beginner', 60, ARRAY['stressed', 'anxious', 'calm']),
('Standing Forward Bend', 'Uttanasana', 'Fold forward from hips with straight legs', 'Relieves tension, calms mind', 'beginner', 45, ARRAY['stressed', 'tired', 'anxious']),
('Plank Pose', 'Phalakasana', 'Hold body straight in push-up position', 'Builds core strength', 'beginner', 30, ARRAY['energized', 'focused', 'confident']),
('Low Lunge', 'Anjaneyasana', 'Lunge with back knee down, arms raised', 'Opens hips, builds strength', 'beginner', 45, ARRAY['energized', 'focused', 'confident']),
('Pigeon Pose', 'Eka Pada Rajakapotasana', 'Hip opener with one leg bent forward', 'Deep hip stretch, releases tension', 'intermediate', 90, ARRAY['stressed', 'anxious', 'tense']),
('Camel Pose', 'Ustrasana', 'Kneel and arch back reaching for heels', 'Opens heart, energizes', 'intermediate', 45, ARRAY['sad', 'low-energy', 'tired']),
('Bow Pose', 'Dhanurasana', 'Lie on belly and hold ankles in arch', 'Strengthens back, opens chest', 'intermediate', 30, ARRAY['energized', 'confident', 'focused']),
('Boat Pose', 'Navasana', 'Balance on sitting bones with legs lifted', 'Strengthens core and hip flexors', 'intermediate', 30, ARRAY['energized', 'focused', 'confident']),
('Half Moon Pose', 'Ardha Chandrasana', 'Balance on one leg with body parallel to ground', 'Improves balance and focus', 'intermediate', 45, ARRAY['focused', 'calm', 'confident']),
('Extended Side Angle', 'Utthita Parsvakonasana', 'Deep lunge with arm extended overhead', 'Strengthens legs, stretches sides', 'intermediate', 45, ARRAY['energized', 'focused', 'confident']),
('Revolved Triangle', 'Parivrtta Trikonasana', 'Twist from triangle pose', 'Aids digestion, improves balance', 'intermediate', 45, ARRAY['focused', 'energized', 'calm']),
('Crow Pose', 'Bakasana', 'Arm balance with knees on elbows', 'Builds arm strength and focus', 'advanced', 30, ARRAY['focused', 'confident', 'energized']),
('Headstand', 'Sirsasana', 'Inverted balance on head and forearms', 'Improves focus, builds strength', 'advanced', 60, ARRAY['focused', 'energized', 'confident']),
('Shoulder Stand', 'Sarvangasana', 'Inverted pose on shoulders', 'Calms nervous system', 'advanced', 90, ARRAY['stressed', 'anxious', 'calm']),
('Wheel Pose', 'Urdhva Dhanurasana', 'Full backbend from floor', 'Opens chest, energizes', 'advanced', 30, ARRAY['sad', 'low-energy', 'confident']),
('Fish Pose', 'Matsyasana', 'Lie on back with chest lifted', 'Opens throat and chest', 'beginner', 45, ARRAY['anxious', 'stressed', 'sad']),
('Happy Baby', 'Ananda Balasana', 'Lie on back holding feet', 'Releases lower back and hips', 'beginner', 60, ARRAY['stressed', 'anxious', 'playful']),
('Legs Up Wall', 'Viparita Karani', 'Lie with legs vertical against wall', 'Relieves tired legs, calms mind', 'beginner', 300, ARRAY['tired', 'stressed', 'anxious']),
('Garland Pose', 'Malasana', 'Deep squat with hands at heart', 'Opens hips, aids digestion', 'beginner', 60, ARRAY['calm', 'grounded', 'focused']),
('Eagle Pose', 'Garudasana', 'Balance with legs and arms wrapped', 'Improves focus and balance', 'intermediate', 45, ARRAY['focused', 'calm', 'confident']),
('Dancer Pose', 'Natarajasana', 'Balance holding foot behind in arch', 'Improves balance, opens chest', 'intermediate', 45, ARRAY['confident', 'graceful', 'focused']),
('Side Plank', 'Vasisthasana', 'Balance on one hand and side of foot', 'Builds core and arm strength', 'intermediate', 30, ARRAY['energized', 'focused', 'confident']),
('Sphinx Pose', 'Salamba Bhujangasana', 'Gentle backbend on forearms', 'Gentle back strengthening', 'beginner', 60, ARRAY['calm', 'tired', 'low-energy']),
('Supine Twist', 'Supta Matsyendrasana', 'Lie on back with knees to side', 'Releases spine, aids digestion', 'beginner', 90, ARRAY['stressed', 'tense', 'calm']),
('Lizard Pose', 'Utthan Pristhasana', 'Deep lunge with forearms down', 'Deep hip opener', 'intermediate', 60, ARRAY['tense', 'stressed', 'focused']),
('Frog Pose', 'Mandukasana', 'Kneel with knees wide apart', 'Deep hip and groin stretch', 'intermediate', 90, ARRAY['tense', 'calm', 'grounded']),
('Reverse Warrior', 'Viparita Virabhadrasana', 'Warrior with back bend and arm reaching back', 'Opens side body, energizes', 'beginner', 45, ARRAY['energized', 'confident', 'joyful']),
('Goddess Pose', 'Utkata Konasana', 'Wide squat with arms raised', 'Builds leg strength, empowering', 'beginner', 45, ARRAY['confident', 'energized', 'strong']),
('Twisted Chair', 'Parivrtta Utkatasana', 'Chair pose with twist', 'Builds strength, aids digestion', 'intermediate', 45, ARRAY['energized', 'focused', 'detox']),
('Wild Thing', 'Camatkarasana', 'Side plank with heart opening flip', 'Opens heart, builds joy', 'intermediate', 30, ARRAY['joyful', 'confident', 'playful']),
('King Pigeon', 'Eka Pada Rajakapotasana II', 'Pigeon with quad stretch', 'Deep hip and quad opener', 'advanced', 90, ARRAY['calm', 'tense', 'focused']),
('Firefly Pose', 'Tittibhasana', 'Arm balance with legs extended', 'Builds strength and focus', 'advanced', 30, ARRAY['confident', 'focused', 'energized']),
('Scorpion Pose', 'Vrschikasana', 'Forearm balance with feet overhead', 'Advanced balance and strength', 'advanced', 30, ARRAY['focused', 'confident', 'fearless']),
('Eight Angle Pose', 'Astavakrasana', 'Arm balance with twisted legs', 'Builds arm strength and focus', 'advanced', 30, ARRAY['focused', 'confident', 'strong']),
('Reclining Hero', 'Supta Virasana', 'Kneel and recline back', 'Stretches quads and ankles', 'intermediate', 90, ARRAY['calm', 'stretched', 'grounded']),
('Seated Twist', 'Ardha Matsyendrasana', 'Seated spinal twist', 'Aids digestion, releases spine', 'beginner', 60, ARRAY['calm', 'detox', 'focused']),
('Reclined Bound Angle', 'Supta Baddha Konasana', 'Lie back with soles of feet together', 'Opens hips, deeply relaxing', 'beginner', 180, ARRAY['calm', 'peaceful', 'relaxed']),
('Extended Puppy', 'Uttana Shishosana', 'Melting heart pose', 'Stretches spine and shoulders', 'beginner', 60, ARRAY['calm', 'stretched', 'peaceful']),
('Thunderbolt Pose', 'Vajrasana', 'Kneeling sitting on heels', 'Aids digestion, improves posture', 'beginner', 120, ARRAY['calm', 'grounded', 'meditative']),
('Cow Face Pose', 'Gomukhasana', 'Seated with stacked knees and arms', 'Opens hips and shoulders', 'intermediate', 90, ARRAY['calm', 'stretched', 'focused']),
('Gate Pose', 'Parighasana', 'Kneeling side stretch', 'Stretches sides, opens lungs', 'beginner', 45, ARRAY['calm', 'energized', 'stretched']),
('Locust Pose', 'Salabhasana', 'Lie on belly and lift chest and legs', 'Strengthens back body', 'beginner', 30, ARRAY['energized', 'strong', 'focused']),
('Warrior III', 'Virabhadrasana III', 'Balance on one leg parallel to ground', 'Builds focus and leg strength', 'intermediate', 45, ARRAY['focused', 'confident', 'strong']),
('Flying Crow', 'Eka Pada Galavasana', 'Arm balance with leg extended', 'Advanced arm balance', 'advanced', 30, ARRAY['focused', 'confident', 'fearless']);