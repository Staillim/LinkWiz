import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDeviceFromUserAgent(ua: string): string {
  if (!ua) return "Unknown";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  if (/(windows phone)/i.test(ua)) return "Mobile";
  if (/(macintosh|mac os x)/i.test(ua)) return "Mac";
  if (/(windows|win32)/i.test(ua)) return "Windows";
  if (/(linux)/i.test(ua)) return "Linux";
  
  return "Desktop";
}
