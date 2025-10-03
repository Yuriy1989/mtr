import React, { useMemo } from "react";
import { Menu } from "antd";
import { v4 as uuidv4 } from "uuid";
import { OBJECT_MENU } from "../../constants/menu";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { pickIconByText } from "../../constants/menuIcons";

const normalizeRoles = (roles) => (roles || []).map(Number).filter((n) => !Number.isNaN(n));

const MainMenu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const userData = useSelector((state) => state.users.userData);
  const userRoles = normalizeRoles(userData?.roles);

  const canSee = (item) => {
    const required = normalizeRoles(item?.rolesRequired || []);
    if (required.length === 0) return true;
    return required.some((r) => userRoles.includes(r));
  };

  const { items, selectedKeys, openKeys } = useMemo(() => {
    const urlToKey = new Map();
    const parentForChild = new Map();

    const built = (OBJECT_MENU || [])
      .map((item, index) => {
        const key = `sub${index + 1}`;
        const childrenSrc = Array.isArray(item.menuLevel_2) ? item.menuLevel_2 : [];
        const visibleChildren = childrenSrc.filter(canSee);
        const hasChildren = visibleChildren.length > 0;

        if (!canSee(item) || (!hasChildren && !item.url)) return null;

        // auto icon
        const ParentIcon =
          item.icon || pickIconByText(item.nameMenu || "", item.url || "");

        if (item.url) urlToKey.set(item.url, key);

        const children = hasChildren
          ? visibleChildren.map((child) => {
              const ckey = uuidv4();
              if (child.url) {
                urlToKey.set(child.url, ckey);
                parentForChild.set(ckey, key);
              }
              return {
                key: ckey,
                label: <NavLink to={child.url}>{child.name}</NavLink>,
                icon: React.createElement(
                  child.icon || pickIconByText(child.name || "", child.url || "")
                ),
              };
            })
          : null;

        return {
          key,
          icon: React.createElement(ParentIcon),
          label: hasChildren ? (
            item.nameMenu
          ) : (
            <NavLink to={item.url}>{item.nameMenu}</NavLink>
          ),
          children,
        };
      })
      .filter(Boolean);

    const matched = [...urlToKey.keys()]
      .filter((u) => pathname.startsWith(u))
      .sort((a, b) => b.length - a.length)[0];

    const sel = matched ? [urlToKey.get(matched)] : [];
    const open = sel.length && parentForChild.get(sel[0]) ? [parentForChild.get(sel[0])] : [];

    return { items: built, selectedKeys: sel, openKeys: open };
  }, [pathname, userRoles]);

  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={selectedKeys}
      defaultOpenKeys={openKeys}
      style={{ height: "100%", borderRight: 0 }}
    />
  );
};

export default MainMenu;
