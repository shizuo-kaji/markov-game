export default function Icon({ name = "arrow", size = 20, ...props }) {
  const paths = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    back: "M20 12H4m6-6-6 6 6 6",
    play: "m8 5 11 7-11 7Z",
    pause: "M8 5v14M16 5v14",
    step: "m5 5 10 7-10 7ZM19 5v14",
    reset: "M3 10a9 9 0 1 1 1.5 7M3 4v6h6",
    plus: "M12 5v14M5 12h14",
    close: "m6 6 12 12M18 6 6 18",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    check: "m5 12 4 4L19 6",
    book: "M12 5v15M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z",
    lab: "M9 3h6M10 3v7L4 20h16l-6-10V3M7 15h10",
    link: "m10 14 4-4M9 16l-2 2a4 4 0 0 1-5-5l5-5a4 4 0 0 1 5 0m0 0 5-5a4 4 0 0 1 5 5l-5 5a4 4 0 0 1-5 0",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    people:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-4M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8m8 0a4 4 0 0 1 0 8",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
    chart: "M4 3v18h17M8 16v-5M13 16V6M18 16v-8",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
