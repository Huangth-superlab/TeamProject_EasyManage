// 抑制浏览器扩展引起的 Hydration 警告的客户端脚本
'use client';

import { useEffect } from 'react';

export function HydrationSuppressor() {
  useEffect(() => {
    // 移除浏览器扩展添加的额外属性，防止 hydration mismatch
    const body = document.body;
    const attributesToRemove = ['uplog_extension-version', 'uplog_extension-id'];

    attributesToRemove.forEach(attr => {
      if (body.hasAttribute(attr)) {
        body.removeAttribute(attr);
      }
    });
  }, []);

  return null;
}
