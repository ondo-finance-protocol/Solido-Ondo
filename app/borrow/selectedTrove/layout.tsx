
import React from "react";

type LayoutProps = {
    children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return <div className="font-mono font-bold ">{children}</div>;
};

export default Layout;