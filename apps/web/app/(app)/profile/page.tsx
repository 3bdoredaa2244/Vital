'use client';

/**
 * Profile — account details, health profile, goals and location, each backed
 * by its own API endpoint:
 *   PUT /users/me                 account (name, phone)
 *   PUT /users/me/health-profile  DOB, sex, height, weight, conditions
 *   PUT /users/me/goals           health goals
 *   PUT /users/me/client-info     activity level + address
 */
import {
  ACTIVITY_LEVELS,
  CHRONIC_CONDITIONS,
  type ActivityLevel,
  type ChronicCondition,
  type Gender,
  type User,
} from '@vital/shared';
import { ageFromDateOfBirth } from '@vital/shared';
import { useState } from 'react';

import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  DataRow,
  Eyebrow,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { contentApi, userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

const CONDITION_LABELS: Record<ChronicCondition, string> = {
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  thyroid: 'Thyroid condition',
  none: 'None',
  prefer_not_to_say: 'Prefer not to say',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very active',
};

const MAX_GOALS = 3;

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <Eyebrow>{title}</Eyebrow>
      {description ? <p className="mb-4 mt-1 text-[13px] text-inkSoft">{description}</p> : <div className="mb-4" />}
      {children}
    </Card>
  );
}

function ChipToggle({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-md border px-3 py-2 text-[13px] transition disabled:opacity-40 ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-line bg-panel text-inkSoft hover:border-accentSoft hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const goalOptions = useApi(() => contentApi.goals(), []);

  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Account
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  // Health profile
  const [dob, setDob] = useState(user?.date_of_birth ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'prefer_not_to_say');
  const [height, setHeight] = useState(user?.height_cm?.toString() ?? '');
  const [weight, setWeight] = useState(user?.weight_kg?.toString() ?? '');
  const [conditions, setConditions] = useState<ChronicCondition[]>(user?.chronic_conditions ?? []);
  const [familyHistory, setFamilyHistory] = useState<ChronicCondition[]>(
    user?.family_history ?? [],
  );

  // Goals
  const [goals, setGoals] = useState<string[]>(user?.health_goals ?? []);

  // Location
  const [activity, setActivity] = useState<ActivityLevel>(user?.activity_level ?? 'moderate');
  const [address, setAddress] = useState(user?.address ?? '');

  if (!user) return <Skeleton height={400} />;

  const age = user.date_of_birth ? ageFromDateOfBirth(user.date_of_birth) : null;

  const run = async (section: string, fn: () => Promise<{ user: User }>) => {
    setSavingSection(section);
    try {
      const { user: updated } = await fn();
      setUser(updated);
      toast.success('Saved.');
    } catch (err) {
      toast.error(messageFor(err, 'Could not save those changes.'));
    } finally {
      setSavingSection(null);
    }
  };

  const toggleIn = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Your details shape your reference ranges, your biological age, and where we come to draw blood."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Summary */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <Eyebrow>Overview</Eyebrow>
          <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
            <div>
              <DataRow label="Name" value={user.full_name} />
              <DataRow label="Email" value={user.email} />
              <DataRow label="Phone" value={user.phone ?? '—'} />
            </div>
            <div>
              <DataRow label="Age" value={age != null ? `${age} years` : '—'} />
              <DataRow label="Sex" value={user.gender ?? '—'} />
              <DataRow label="Member since" value={formatDate(user.created_at)} />
            </div>
          </div>
        </Card>

        {/* Account */}
        <SectionCard title="Account" description="How we address you and reach you.">
          <Field label="Full name" htmlFor="full_name">
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Phone" hint="Egyptian mobile number, e.g. +201012345678" htmlFor="phone">
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Button
            loading={savingSection === 'account'}
            onClick={() =>
              void run('account', () =>
                userApi.update({
                  full_name: fullName.trim(),
                  phone: phone.trim() || undefined,
                }),
              )
            }
          >
            Save account
          </Button>
        </SectionCard>

        {/* Health profile */}
        <SectionCard
          title="Health profile"
          description="Age and sex are required for biological age and personalised ranges."
        >
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Date of birth" htmlFor="dob">
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Sex" htmlFor="gender">
              <Select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Height (cm)" htmlFor="height">
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </Field>
            <Field label="Weight (kg)" htmlFor="weight">
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Chronic conditions">
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map((c) => (
                <ChipToggle
                  key={c}
                  label={CONDITION_LABELS[c]}
                  active={conditions.includes(c)}
                  onClick={() => setConditions((prev) => toggleIn(prev, c))}
                />
              ))}
            </div>
          </Field>

          <Field label="Family history">
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map((c) => (
                <ChipToggle
                  key={c}
                  label={CONDITION_LABELS[c]}
                  active={familyHistory.includes(c)}
                  onClick={() => setFamilyHistory((prev) => toggleIn(prev, c))}
                />
              ))}
            </div>
          </Field>

          <Button
            loading={savingSection === 'health'}
            disabled={!dob}
            onClick={() =>
              void run('health', () =>
                userApi.updateHealthProfile({
                  date_of_birth: dob,
                  gender,
                  height_cm: height ? Number(height) : undefined,
                  weight_kg: weight ? Number(weight) : undefined,
                  chronic_conditions: conditions,
                  family_history: familyHistory,
                }),
              )
            }
          >
            Save health profile
          </Button>
        </SectionCard>

        {/* Goals */}
        <SectionCard title="Goals" description={`Pick up to ${MAX_GOALS}. They prioritise your recommendations.`}>
          {goalOptions.loading ? (
            <Skeleton height={90} />
          ) : goalOptions.error ? (
            <p className="mb-4 text-sm text-inkSoft">Could not load the goal list.</p>
          ) : (
            <div className="mb-4 flex flex-wrap gap-2">
              {(goalOptions.data?.goals ?? [])
                .filter((g) => g.is_active)
                .map((g) => {
                  const active = goals.includes(g.slug);
                  return (
                    <ChipToggle
                      key={g.id}
                      label={g.label}
                      active={active}
                      disabled={!active && goals.length >= MAX_GOALS}
                      onClick={() => setGoals((prev) => toggleIn(prev, g.slug))}
                    />
                  );
                })}
            </div>
          )}
          <Button
            loading={savingSection === 'goals'}
            disabled={goals.length === 0}
            onClick={() => void run('goals', () => userApi.updateGoals({ health_goals: goals }))}
          >
            Save goals
          </Button>
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location & activity" description="Where the visiting clinician should come.">
          <Field label="Activity level" htmlFor="activity">
            <Select
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a} value={a}>
                  {ACTIVITY_LABELS[a]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Address" htmlFor="address">
            <Textarea
              id="address"
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Street 200, Degla, Maadi, Cairo — 3rd floor, apt 5"
            />
          </Field>
          <Button
            loading={savingSection === 'location'}
            onClick={() =>
              void run('location', () =>
                userApi.updateClientInfo({
                  activity_level: activity,
                  address: address.trim() || undefined,
                }),
              )
            }
          >
            Save location
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}
