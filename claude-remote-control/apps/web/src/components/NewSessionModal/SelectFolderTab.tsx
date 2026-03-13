"use client";

import { ProjectDropdown } from "./ProjectDropdown";

interface SelectFolderTabProps {
  folders: string[];
  loadingFolders: boolean;
  onSelectProject: (project: string) => void;
  selectedProject: string;
}

export function SelectFolderTab({
  folders,
  selectedProject,
  onSelectProject,
  loadingFolders,
}: SelectFolderTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <span
          className="mb-3 block font-medium text-sm text-white/60"
          id="project-selector-label"
        >
          Select Project
        </span>
        <ProjectDropdown
          folders={folders}
          loading={loadingFolders}
          onSelectProject={onSelectProject}
          selectedProject={selectedProject}
        />
      </div>
    </div>
  );
}
