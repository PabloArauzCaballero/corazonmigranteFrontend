import React from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";

import PublicViewEditorCard from "../components/PublicViewEditorCard";
import PublicViewPreviewCard from "../components/PublicViewPreviewCard";
import UIComponentsTableCard from "../components/UIComponentsTableCard";
import ServerDirsExplorerCard from "../components/ServerDirsExplorerCard";
import ServerFilesTableCard from "../components/ServerFilesTableCard";

import { useVistasPublicasAdmin } from "../hooks/useVistasPublicasAdmin";

export default function VistasPublicasDashboard({ session, onLogout, activeTab, onNavigate }) {
    const vm = useVistasPublicasAdmin(session);

    return (
        <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
            <HeaderAdmin
                session={session}
                onLogout={onLogout}
                activeTab={activeTab}
                onNavigate={onNavigate}
            />

            <div className="bg-brand-cream border-b border-slate-200 px-10 py-10">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] mb-3 uppercase tracking-widest font-bold">
                        <span>Inicio</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary">Vistas públicas</span>
                    </div>

                    <div>
                        <h1 className="text-4xl font-display text-slate-900 mb-3 font-bold tracking-tight">
                            Gestión de Vistas Públicas
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl font-light">
                            Administra contenido, componentes y archivos visibles en tus páginas públicas
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <PublicViewEditorCard
                        selectedView={vm.selectedView}
                        setSelectedView={vm.setSelectedView}
                        title={vm.title}
                        setTitle={vm.setTitle}
                        description={vm.description}
                        setDescription={vm.setDescription}
                        isVisible={vm.isVisible}
                        setIsVisible={vm.setIsVisible}
                        file={vm.file}
                        setFile={vm.setFile}
                        uploadDir={vm.selectedUploadDir}

                        disabled={!vm.editingUiElement}
                        editingUiElement={vm.editingUiElement}

                        onSubmit={vm.saveEditingUiElement}
                        isSaving={vm.saveLoading}
                        saveError={vm.saveError}
                        onCancel={vm.stopEditUiElement}
                    />

                    <PublicViewPreviewCard
                        title={vm.title}
                        description={vm.description}
                        editingUiElement={vm.editingUiElement}
                        file={vm.file}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <UIComponentsTableCard
                        rows={vm.uiComponents}
                        isLoading={vm.uiLoading}
                        error={vm.uiError}
                        onRefresh={() => vm.listUiComponents({ limit: vm.uiLimit, offset: vm.uiOffset })}
                        onEdit={vm.startEditUiElement}

                        page={vm.uiPage}
                        limit={vm.uiLimit}
                        hasNext={vm.uiHasNext}
                        onPrev={vm.uiPrev}
                        onNext={vm.uiNext}
                        onLimitChange={vm.uiChangeLimit}

                        activeId={vm.editingUiElement?.id ?? null}
                    />

                    <div className="flex flex-col gap-8">
                        <ServerDirsExplorerCard
                            prefix={vm.filesPrefix}
                            dirs={vm.serverDirs}
                            isLoading={vm.filesLoading}
                            error={vm.filesError}
                            selectedDir={vm.selectedUploadDir}
                            onUp={vm.goUpDir}
                            onOpen={vm.openDir}
                            onUse={vm.selectUploadDir}
                        />

                        <ServerFilesTableCard
                            rows={vm.serverFiles}
                            onDownload={vm.downloadFile}
                            onDelete={vm.deleteFile}
                            isDeleting={vm.isDeletingFile}
                            isDownloading={vm.isDownloadingFile}
                            defaultLimit={10}
                        />
                    </div>
                </div>

                <footer className="px-8 py-12 text-center">
                    <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mb-2">
                        Fundación Corazón de Migrante
                    </p>
                    <p className="text-[10px] text-gray-500 font-light">
                        © 2026 Todos los derechos reservados. Sistema de Gestión Premium.
                    </p>
                </footer>
            </main>
        </div>
    );
}
