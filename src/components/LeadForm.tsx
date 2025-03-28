import React, { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader, Check } from "lucide-react";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormCombobox from "@/components/FormCombobox";
import FormTextarea from "@/components/FormTextarea";
import FormDatePicker from "@/components/FormDatePicker";
import { formatPhone, formatDate } from "@/lib/formatters";
import { leadFormSchema, LeadFormValues } from "@/lib/leadValidators";
import { submitToGoogleSheets } from "@/services/GoogleSheetsService";
import { format } from "date-fns";

const LeadForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      instagram: "",
      interesse: "",
      statusLead: "Novo",
      dataLembrete: undefined,
      motivoLembrete: "",
      observacoes: "",
    },
  });

  const handleInputChange = (field: keyof LeadFormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setValue(field, e.target.value);
  };

  const handleSelectChange = (field: keyof LeadFormValues) => (value: string) => {
    setValue(field, value);
  };

  const handleTextareaChange = (field: keyof LeadFormValues) => (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(field, e.target.value);
  };

  const handleDateChange = (field: keyof LeadFormValues) => (date: Date | undefined) => {
    setValue(field, date);
  };

  const onSubmit = async (data: LeadFormValues) => {
    console.log("Lead form submission triggered with data:", data);
    setIsSubmitting(true);
    
    try {
      const formattedData = {
        ...data,
        dataLembrete: data.dataLembrete ? format(data.dataLembrete, "dd/MM/yy") : "",
        formType: 'lead', // Identificador para saber que é um formulário de lead
      };
      
      console.log("Sending formatted lead data to Google Sheets:", formattedData);
      const result = await submitToGoogleSheets(formattedData);
      console.log("Response from Google Sheets for lead form:", result);
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Dados do lead enviados com sucesso para a planilha.",
        });
        setSubmitted(true);
        setTimeout(() => {
          reset();
          setSubmitted(false);
        }, 3000);
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in lead form submission:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="form-section space-y-4">
            <h2 className="text-2xl font-semibold text-delta-800 mb-4">
              Informações do Lead
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="nome-lead"
                label="Nome Completo"
                value={watch("nome")}
                onChange={handleInputChange("nome")}
                placeholder="Digite o nome completo"
                error={errors.nome?.message}
                required
              />
              <FormInput
                id="telefone-lead"
                label="Telefone"
                value={watch("telefone")}
                onChange={handleInputChange("telefone")}
                placeholder="(00) 00000-0000"
                error={errors.telefone?.message}
                formatter={formatPhone}
                required
                maxLength={15}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="instagram-lead"
                label="Instagram"
                value={watch("instagram") || ""}
                onChange={handleInputChange("instagram")}
                placeholder="@perfil"
                error={errors.instagram?.message}
              />
              <FormCombobox
                id="interesse-lead"
                label="Interesse"
                value={watch("interesse")}
                onChange={handleSelectChange("interesse")}
                onCustomInputChange={handleInputChange("interesse")}
                options={[
                  { value: "Lançamento de produtos", label: "Lançamento de produtos" },
                  { value: "Promoções", label: "Promoções" },
                  { value: "Personalização de pedidos", label: "Personalização de pedidos" },
                ]}
                error={errors.interesse?.message}
                required
              />
            </div>
          </div>

          <Separator />

          <div className="form-section space-y-4">
            <h2 className="text-2xl font-semibold text-delta-800 mb-4">
              Status e Acompanhamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                id="status-lead"
                label="Status do Lead"
                value={watch("statusLead")}
                onChange={handleSelectChange("statusLead")}
                options={[
                  { value: "Novo", label: "Novo" },
                  { value: "Em negociação", label: "Em negociação" },
                  { value: "Qualificado", label: "Qualificado" },
                  { value: "Não qualificado", label: "Não qualificado" },
                ]}
                error={errors.statusLead?.message}
                required
              />
              <FormDatePicker
                id="data-lembrete-lead"
                label="Data de Lembrete"
                value={watch("dataLembrete")}
                onChange={handleDateChange("dataLembrete")}
                error={errors.dataLembrete?.message}
                required
                placeholder="Selecione uma data para o lembrete"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormTextarea
                id="motivo-lembrete-lead"
                label="Motivo do Lembrete"
                value={watch("motivoLembrete")}
                onChange={handleTextareaChange("motivoLembrete")}
                placeholder="Digite o motivo do lembrete"
                error={errors.motivoLembrete?.message}
                required
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="form-section">
            <FormTextarea
              id="observacoes-lead"
              label="Observações Adicionais"
              value={watch("observacoes") || ""}
              onChange={handleTextareaChange("observacoes")}
              placeholder="Digite informações adicionais, se necessário"
              error={errors.observacoes?.message}
              rows={4}
            />
          </div>

          <div className="form-section flex justify-center pt-4">
            <Button
              type="submit"
              className="w-full md:w-1/2 h-12 bg-delta-600 hover:bg-delta-700 text-white font-semibold text-lg transition-colors"
              disabled={isSubmitting || submitted}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  Enviando...
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Enviado com Sucesso!
                </span>
              ) : (
                "Enviar Dados do Lead"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadForm;
