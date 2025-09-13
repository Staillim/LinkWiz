import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDeviceFromUserAgent(ua: string): string {
  if (!ua) return "Unknown";

  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) {
    if (/mobile/i.test(ua)) {
      return "Android";
    }
    return "Tablet";
  }
  if (/(tablet|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|iP(od)|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  if (/(windows phone)/i.test(ua)) return "Windows Phone";
  if (/(macintosh|mac os x)/i.test(ua)) return "Mac";
  if (/(windows|win32)/i.test(ua)) return "Windows";
  if (/(linux)/i.test(ua)) return "Linux";
  
  return "Desktop";
}
