import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCareer,
  useStartMatch,
  useSubmitResult,
  usePullAutodarts,
  useResetCareer,
  useSetPlayerName,
  useBuyEquipment,
  useGetTournamentHistory,
  useGetH2H,
  useGetCalendar,
  useGetEquipment,
  getGetCareerQueryKey,
  getGetTournamentHistoryQueryKey,
  getGetH2HQueryKey,
  getGetCalendarQueryKey,
  getGetEquipmentQueryKey,
} from "@workspace/api-client-react";
import type { MatchResult } from "@workspace/api-client-react/src/generated/api.schemas";

export function useCareerActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetCareerQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTournamentHistoryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetH2HQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetEquipmentQueryKey() });
  };

  const handleSuccess = (data: any) => {
    if (data?.messages && Array.isArray(data.messages)) {
      data.messages.forEach((msg: string) => {
        const isError = msg.includes("❌");
        const isAchievement = msg.includes("⭐") || msg.includes("👑") || msg.includes("💰");
        const isWin = msg.includes("🏆") || msg.includes("TOURCARD");
        toast({
          title: isAchievement ? "Achievement!" : isWin ? "Turniersieg!" : isError ? "Fehler" : "Update",
          description: msg,
          className: isError
            ? "border-destructive"
            : isAchievement || isWin
            ? "border-yellow-400 bg-yellow-950"
            : "border-primary",
        });
      });
    }
    invalidateAll();
  };

  const handleError = (error: any) => {
    toast({
      variant: "destructive",
      title: "Fehler",
      description: error.message || "Es ist ein Fehler aufgetreten.",
    });
  };

  const startMatchMutation = useStartMatch({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const submitResultMutation = useSubmitResult({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const pullAutodartsMutation = usePullAutodarts({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const resetCareerMutation = useResetCareer({
    mutation: {
      onSuccess: (data) => {
        handleSuccess(data);
        toast({ title: "Karriere zurückgesetzt!", description: "Alles auf Anfang." });
      },
      onError: handleError,
    },
  });
  const setNameMutation = useSetPlayerName({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const buyEquipmentMutation = useBuyEquipment({ mutation: { onSuccess: handleSuccess, onError: handleError } });

  return {
    startMatch: startMatchMutation.mutate,
    isStarting: startMatchMutation.isPending,

    submitResult: (data: MatchResult) => submitResultMutation.mutate({ data }),
    isSubmitting: submitResultMutation.isPending,

    pullAutodarts: pullAutodartsMutation.mutate,
    isPulling: pullAutodartsMutation.isPending,

    resetCareer: resetCareerMutation.mutate,
    isResetting: resetCareerMutation.isPending,

    setPlayerName: (args: string | { name: string; schwierigkeitsgrad?: number }) => {
      const data = typeof args === "string"
        ? { name: args, schwierigkeitsgrad: 5 }
        : { name: args.name, schwierigkeitsgrad: args.schwierigkeitsgrad ?? 5 };
      setNameMutation.mutate({ data });
    },
    isSettingName: setNameMutation.isPending,

    buyEquipment: (id: string) => buyEquipmentMutation.mutate({ data: { id } }),
    isBuying: buyEquipmentMutation.isPending,
  };
}

export { useGetCareer, useGetTournamentHistory, useGetH2H, useGetCalendar, useGetEquipment };
