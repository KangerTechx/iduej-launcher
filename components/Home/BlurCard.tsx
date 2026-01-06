export default function BlurCard({
    children
  }: Readonly<{
    children: React.ReactNode
  }>) {

    return(
        <div className="bg-background/20 rounded-xl backdrop-blur-sm hover:backdrop-blur-lg w-fit hover:bg-primary/10 min-w-60 overflow-hidden shadow-2xl">
            {children}
        </div>
    )
}