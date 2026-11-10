declare module 'react' {
  export = React;
  export as namespace React;
  namespace React {
    type Key = string | number | bigint;
    type ReactNode = any;
    type PropsWithChildren<P = {}> = P & { children?: ReactNode };
    type FC<P = {}> = (props: P & { key?: Key }) => any;
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useMemo<T>(factory: () => T, deps: any[]): T;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element extends React.ReactNode {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
  export namespace JSX {
    interface Element extends React.ReactNode {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-native' {
  export type StyleProp<T = any> = any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export function useWindowDimensions(): {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  };
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const SafeAreaView: any;
  export const TextInput: any;
  export const StatusBar: any;
  export const Dimensions: any;
  export const Platform: any;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'react-native-url-polyfill/auto' {}
