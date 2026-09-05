export function Avatar({name}:{name:string}){return <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-200 text-xs font-bold">{name.slice(0,2).toUpperCase()}</div>}
