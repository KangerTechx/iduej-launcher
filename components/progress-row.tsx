"use client"

import { Progress } from "@/components/ui/progress"

type Props = {
  file: { filename?: string; percent?: number }
  index: number
  total: number
}

export default function ProgressRow({ file, index, total }: Props) {
  const percent = file?.percent ?? 0
  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-sm mb-1">
        <div className="truncate">{file?.filename}</div>
        <div>{percent}% • {index}/{total}</div>
      </div>
      <div className="w-64">
        <Progress value={percent} />
      </div>
    </div>
  )
}
