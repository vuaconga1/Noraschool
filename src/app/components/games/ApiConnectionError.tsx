"use client";

type Props = {
  onRetry?: () => void;
  message?: string;
};

export function ApiConnectionError({ onRetry, message }: Props) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-800">
        Không tải được dữ liệu
      </h2>
      <p className="max-w-md text-sm text-slate-600">
        {message ||
          "Không gọi được API. Kiểm tra kết nối mạng hoặc thử lại. API dùng cùng origin (/api)."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export default ApiConnectionError;
