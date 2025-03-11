import SideNav from "@/app/ui/dashboard/sidenav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
// This layout component is a flex container with two children: a side navigation and the main content.
// The side navigation is a fixed-width column on the left side of the screen.
// The main content is a flex-grow container that fills the remaining space.
// The main content is a scrollable container on small screens and a fixed-height container on large screens.
// You can customize the layout further by adding more components or changing the styles.
// For example, you can add a header, footer, or additional content to the layout.
// You can also change the background color, font size, or padding of the layout.
// For more information about flexbox and tailwind classes, see the Tailwind CSS documentation.
// For more information about React components and props, see the React documentation.