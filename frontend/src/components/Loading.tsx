import { Spinner } from "./ui/spinner"

function Loading() {
  return (
    <div className="flex justify-center items-center h-full w-full">
        <Spinner className="size-8"/>
    </div>
  )
}

export default Loading