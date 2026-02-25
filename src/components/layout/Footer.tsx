import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="py-12 border-t border-white/10 bg-zinc-950">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="max-w-xs">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/logo.svg"
                                alt="Statuscode Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                            Statuscode
                        </span>
                    </Link>
                    <p className="text-zinc-500 text-sm">
                        Status pages that bring joy, even when your servers are crying.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-12 sm:gap-20">
                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="flex flex-col gap-2 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-statuscode-500 transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-statuscode-500 transition-colors">Changelog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="flex flex-col gap-2 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-statuscode-500 transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-statuscode-500 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-statuscode-500 transition-colors">Twitter</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-6 mt-12 pt-8 border-t border-zinc-100 border-white/5 flex flex-col sm:flex-row justify-between items-center text-sm text-zinc-400">
                <p>A project by the creators of CalcSuite.</p>
                <div className="flex gap-4 mt-4 sm:mt-0 items-center">
                    <span>Built with Framer Motion + Statuscode.</span>
                    <span className="w-px h-4 bg-zinc-700 mx-2"></span>
                    <Link href="#" className="hover:text-zinc-600 hover:text-zinc-300">Twitter</Link>
                    <Link href="#" className="hover:text-zinc-600 hover:text-zinc-300">GitHub</Link>
                </div>
            </div>
        </footer>
    );
}
