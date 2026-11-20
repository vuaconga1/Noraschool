/**
 * Public (unauthenticated) API client — same relative /api host.
 * Cookie still sent when present; games work without login.
 */

import axiosClient from "@/lib/auth/axios";

const publicClient = axiosClient;

export default publicClient;
