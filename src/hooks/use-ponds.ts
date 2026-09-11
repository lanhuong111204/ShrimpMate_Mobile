import { useCallback, useEffect, useState } from 'react';
import { pondService } from '@/api/services/pond.service';
import { Pond } from '@/types/pond';

export function usePonds() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPonds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pondService.getPonds();
      setPonds(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách ao nuôi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPonds();
  }, [fetchPonds]);

  const toggleDevice = async (pondId: string, deviceId: string) => {
    const updatedDevice = await pondService.toggleDevice(pondId, deviceId);
    if (updatedDevice) {
      setPonds((prev) =>
        prev.map((pond) => {
          if (pond.id !== pondId || !pond.devices) return pond;
          return {
            ...pond,
            devices: pond.devices.map((d) => (d.id === deviceId ? updatedDevice : d)),
          };
        })
      );
    }
  };

  return {
    ponds,
    isLoading,
    error,
    refresh: fetchPonds,
    toggleDevice,
  };
}
