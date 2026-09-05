import {ReactNode} from 'react'; export function Table({children}:{children:ReactNode}){return <div className="overflow-x-auto"><table className="w-full text-left text-sm">{children}</table></div>}
