export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-slate-300">{children}</label>;
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"w-full px-3 py-2 rounded-md bg-[#0e1627] border border-white/10 placeholder:text-slate-500 outline-none focus:border-blue-500 " + (props.className||"")}
    />
  );
}
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={"w-full py-2 rounded-md font-medium bg-gradient-to-r from-blue-500 to-blue-700 hover:brightness-110 transition disabled:opacity-50 " + (props.className||"")}
    />
  );
}
export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={"w-full py-2 rounded-md border border-white/15 text-slate-200 hover:bg-white/5 transition " + (props.className||"")}
    />
  );
}
