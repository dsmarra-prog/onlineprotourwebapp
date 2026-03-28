import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCareer,
  useStartMatch,
  useSubmitResult,
  usePullAutodarts,
  useResetCareer,
  getGetCareerQueryKey,
} from "@workspace/api-client-react";
import type { MatchResult } from "@workspace/api-client-react/src/generated/api.schemas";

// Utility hook to wrap mutations with toast notifications and query invalidation
export function useCareerActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSuccess = (data: any) => {
    // Show toasts for all messages returned from the backend
    if (data?.messages && Array.isArray(data.messages)) {
      data.messages.forEach((msg: string) => {
        toast({
          title: "Update",
          description: msg,
          className: msg.includes("❌") ? "border-destructive text-destructive-foreground" : "border-primary",
        });
      });
    }
    // Invalidate the main career query to refresh UI
    queryClient.invalidateQueries({ queryKey: getGetCareerQueryKey() });
  };

  const handleError = (error: any) => {
    toast({
      variant: "destructive",
      title: "Fehler",
      description: error.message || "Es ist ein Fehler aufgetreten.",
    });
  };

  const startMatchMutation = useStartMatch({
    mutation: { onSuccess: handleSuccess, onError: handleError }
  });

  const submitResultMutation = useSubmitResult({
    mutation: { onSuccess: handleSuccess, onError: handleError }
  });

  const pullAutodartsMutation = usePullAutodarts({
    mutation: { onSuccess: handleSuccess, onError: handleError }
  });

  const resetCareerMutation = useResetCareer({
    mutation: { 
      onSuccess: (data) => {
        handleSuccess(data);
        toast({ title: "Karriere zurückgesetzt!", description: "Alles auf Anfang." });
      }, 
      onError: handleError 
    }
  });

  return {
    startMatch: startMatchMutation.mutate,
    isStarting: startMatchMutation.isPending,
    
    submitResult: (data: MatchResult) => submitResultMutation.mutate({ data }),
    isSubmitting: submitResultMutation.isPending,
    
    pullAutodarts: pullAutodartsMutation.mutate,
    isPulling: pullAutodartsMutation.isPending,
    
    resetCareer: resetCareerMutation.mutate,
    isResetting: resetCareerMutation.isPending,
  };
}

export { useGetCareer };
