import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const emptySubscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true
  );

  const colorScheme = useRNColorScheme();

  if (!isServer) {
    return colorScheme;
  }

  return 'light';
}

