import { useContext } from "react";
import { SocketContext } from "../socket/SocketProvider";

export function useSocket() {
  return useContext(SocketContext);
}

export default useSocket;
