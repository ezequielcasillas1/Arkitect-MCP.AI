import { routeSeo } from "./data";
import type { RouteSeoKey, SeoMeta } from "./types";
import { useDocumentSeo } from "./useDocumentSeo";

interface RouteProps {
  route: RouteSeoKey;
  meta?: never;
}

interface MetaProps {
  route?: never;
  meta: SeoMeta;
}

export type SeoHeadProps = RouteProps | MetaProps;

export function SeoHead(props: SeoHeadProps): null {
  const resolved: SeoMeta = props.meta ?? routeSeo[props.route as RouteSeoKey];
  useDocumentSeo(resolved);
  return null;
}
