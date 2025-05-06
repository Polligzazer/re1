import { createContext, useReducer, ReactNode, useContext } from "react";
import { AuthContext } from "./Authcontext";
import React from "react";

interface UserInfo {
    uid: string;
    name: string;
}

interface ChatState {
    chatId: string | null;
    user: { name?: string; uid?: string };
}

interface ChatContextType {
    data: ChatState;
    dispatch: React.Dispatch<any>;
}


export const ChatContext = createContext<ChatContextType | null>(null);


export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChatContext must be used within a ChatProvider");
    return context;
};


interface ChatProviderProps {
    children: ReactNode;
}

export const ChatContextProvider = ({ children }: ChatProviderProps) => {
    const { currentUser } = useContext(AuthContext) as { currentUser: { uid: string } | null };

    const INITIAL_STATE: ChatState = {
        chatId: null,
        user: {},
    };

    const chatReducer = (state: ChatState, action: { type: string; payload: UserInfo }) => {
        switch (action.type) {
            case "CHANGE_USER":
                if (!currentUser || !action.payload?.uid) {
                    return state;
                }

                return {
                    user: action.payload,
                    chatId:
                        currentUser.uid > action.payload.uid
                            ? currentUser.uid + action.payload.uid
                            : action.payload.uid + currentUser.uid,
                };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

    return (
        <ChatContext.Provider value={{ data: state, dispatch}}>
            {children}
        </ChatContext.Provider>
    );
};
