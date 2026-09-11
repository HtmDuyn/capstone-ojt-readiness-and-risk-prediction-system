import { createContext, type ReactNode } from "react";

type AuthContextValue = {
	isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
	isAuthenticated: false,
});

type AuthProviderProps = {
	children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
	return (
		<AuthContext.Provider value={{ isAuthenticated: false }}>
			{children}
		</AuthContext.Provider>
	);
}
