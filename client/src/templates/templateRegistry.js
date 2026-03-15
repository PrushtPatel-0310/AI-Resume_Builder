import DefaultTemplate from "./DefaultTemplate";
import ElegantSidebar from "./ElegantSidebar";
import IvyLeague from "./IvyLeague";
import Classic from "./Classic";
import Timeline from "./Timeline";

export const TEMPLATE_MAP = {
  default: DefaultTemplate,
  elegant: ElegantSidebar,
  ivy: IvyLeague,
  classic: Classic,
  modern: Classic,
  timeline: Timeline,
  minimalist: Timeline,
  executive: DefaultTemplate,
  creative: DefaultTemplate,
  corporate: DefaultTemplate,
  "ats-friendly": DefaultTemplate,
};

export const templateRegistry = TEMPLATE_MAP;
