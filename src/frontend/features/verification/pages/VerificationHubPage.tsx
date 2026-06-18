import { useMutation, useQuery } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createVerification,
  getVerificationHistory,
  uploadImage,
} from '../../../shared/api/verificationApi';
import { toApiError } from '../../../shared/api/httpClient';
import { Alert } from '../../../shared/components/ui/alert';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { recommendationLabel } from '../../../shared/components/report/labels';
import { InputType } from '../../../shared/types/verification';

const inputModes: Array<{ value: InputType; label: string }> = [
  { value: 'TEXT', label: 'Text' },
  { value: 'URL', label: 'URL' },
  { value: 'IMAGE', label: 'Image' },
];

export function VerificationHubPage() {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<InputType>('TEXT');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['verification-history', 'recent'],
    queryFn: getVerificationHistory,
  });

  const recentCases = useMemo(
    () => (historyQuery.data ?? []).slice(0, 5),
    [historyQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: createVerification,
    onSuccess: (report) => {
      navigate(`/app/verification/${report.caseId}`);
    },
    onError: (error) => {
      const parsed = toApiError(error);
      setApiError(parsed.traceId ? `${parsed.message} (traceId: ${parsed.traceId})` : parsed.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (uploaded) => {
      setUploadedImageId(uploaded.id);
    },
    onError: (error) => {
      const parsed = toApiError(error);
      setApiError(parsed.traceId ? `${parsed.message} (traceId: ${parsed.traceId})` : parsed.message);
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setApiError(null);

    if (inputType === 'TEXT') {
      if (text.trim().length < 20) {
        setApiError('Text verification requires at least 20 characters.');
        return;
      }

      createMutation.mutate({
        inputType: 'TEXT',
        text: text.trim(),
      });
      return;
    }

    if (inputType === 'URL') {
      if (!url.trim()) {
        setApiError('URL is required.');
        return;
      }

      try {
        // Basic client-side URL validation for demo UX.
        new URL(url.trim());
      } catch {
        setApiError('Please enter a valid URL.');
        return;
      }

      createMutation.mutate({
        inputType: 'URL',
        url: url.trim(),
      });
      return;
    }

    if (!selectedImage && !uploadedImageId) {
      setApiError('Please select an image first.');
      return;
    }

    const runImageFlow = async (): Promise<void> => {
      let fileId = uploadedImageId;

      if (!fileId && selectedImage) {
        const uploaded = await uploadMutation.mutateAsync(selectedImage);
        fileId = uploaded.id;
      }

      if (!fileId) {
        setApiError('Image upload failed. Please try again.');
        return;
      }

      createMutation.mutate({
        inputType: 'IMAGE',
        uploadedFileId: fileId,
      });
    };

    void runImageFlow();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Submit Suspicious Content</CardTitle>
          <CardDescription>
            Start verification and generate an editorial analysis report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="flex flex-wrap gap-2">
              {inputModes.map((mode) => (
                <Button
                  key={mode.value}
                  type="button"
                  variant={inputType === mode.value ? 'primary' : 'secondary'}
                  onClick={() => setInputType(mode.value)}
                >
                  {mode.label}
                </Button>
              ))}
            </div>

            {inputType === 'TEXT' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Claim text</p>
                <Textarea
                  placeholder="Paste suspicious content with enough context..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <p className="text-xs text-slate-500">Minimum 20 characters.</p>
              </div>
            ) : null}

            {inputType === 'URL' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Article URL</p>
                <Input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/article"
                />
                <p className="text-xs text-slate-500">The backend uses deterministic mock extraction for URL content.</p>
              </div>
            ) : null}

            {inputType === 'IMAGE' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Image file</p>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setSelectedImage(nextFile);
                    setUploadedImageId(null);
                  }}
                />
                <p className="text-xs text-slate-500">Accepted formats: JPEG, PNG, WEBP (max 5 MB).</p>
                {selectedImage ? (
                  <p className="text-xs text-slate-600">Selected file: {selectedImage.name}</p>
                ) : null}
                {uploadedImageId ? (
                  <Alert variant="success">Image uploaded in mock storage with id {uploadedImageId}.</Alert>
                ) : null}
              </div>
            ) : null}

            {apiError ? <Alert variant="danger">{apiError}</Alert> : null}

            <Button type="submit" disabled={createMutation.isPending || uploadMutation.isPending}>
              {createMutation.isPending || uploadMutation.isPending
                ? 'Generating report...'
                : 'Generate report'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
          <CardDescription>Quick access to latest verifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyQuery.isLoading ? <p className="text-sm text-slate-500">Loading recent cases...</p> : null}
          {historyQuery.isError ? (
            <p className="text-sm text-red-700">Could not load recent cases.</p>
          ) : null}
          {!historyQuery.isLoading && recentCases.length === 0 ? (
            <p className="text-sm text-slate-600">No cases yet. Submit your first verification.</p>
          ) : null}
          {recentCases.map((item) => (
            <button
              key={item.caseId}
              type="button"
              onClick={() => navigate(`/app/verification/${item.caseId}`)}
              className="w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
            >
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.originalInputPreview}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Badge variant="muted">{item.status}</Badge>
                {item.recommendedAction ? (
                  <span className="text-xs text-slate-600">{recommendationLabel[item.recommendedAction]}</span>
                ) : null}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
