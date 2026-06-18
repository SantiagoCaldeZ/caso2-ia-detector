import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuthSession } from '../../../app/providers/AuthProvider';
import { toApiError } from '../../../shared/api/httpClient';
import { Button } from '../../../shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must have at least 8 characters.'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthSession();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      await register(values);
      navigate('/login', { replace: true });
    } catch (error) {
      const parsed = toApiError(error);
      setApiError(parsed.traceId ? `${parsed.message} (traceId: ${parsed.traceId})` : parsed.message);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">IA Detector</p>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Register as journalist and start verification flows.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name ? (
                <p className="text-xs text-red-700">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-700">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password ? (
                <p className="text-xs text-red-700">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            {apiError ? <p className="text-sm text-red-700">{apiError}</p> : null}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="font-semibold text-[var(--primary)] hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
