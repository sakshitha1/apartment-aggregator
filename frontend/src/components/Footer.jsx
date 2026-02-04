export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a className="hover:text-zinc-900" href="#">
            About
          </a>
          <a className="hover:text-zinc-900" href="#">
            Help
          </a>
          <a className="hover:text-zinc-900" href="#">
            Terms
          </a>
          <a className="hover:text-zinc-900" href="#">
            Privacy
          </a>
        </div>
        <div>© {new Date().getFullYear()} RealEstate Marketplace</div>
      </div>
    </footer>
  )
}

